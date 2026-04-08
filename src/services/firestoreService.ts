import { collection, doc, writeBatch, deleteDoc, setDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Account, Budget, Category, Transaction, TransactionTemplate, SavingGoal } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const firestoreService = {
  async addTransaction(transaction: Omit<Transaction, 'id'>, currentAccounts: Account[], currentTransactions: Transaction[]) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");

    const batch = writeBatch(db);
    const newId = uuidv4();
    const newTx: any = { ...transaction, id: newId, userId };
    
    // Remove undefined values
    Object.keys(newTx).forEach(key => {
      if (newTx[key] === undefined) {
        delete newTx[key];
      }
    });
    
    batch.set(doc(db, `users/${userId}/transactions`, newId), newTx);

    if (newTx.reimbursedTxIds && newTx.reimbursedTxIds.length > 0) {
      newTx.reimbursedTxIds.forEach(tid => {
        batch.update(doc(db, `users/${userId}/transactions`, tid), { isReimbursed: true, reimbursedByTxId: newId });
      });
    }

    // Update accounts
    currentAccounts.forEach(acc => {
      let balanceChange = 0;
      if (newTx.type === 'expense' && acc.id === newTx.fromAccountId) balanceChange -= newTx.amount;
      if (newTx.type === 'income' && acc.id === newTx.toAccountId) balanceChange += newTx.amount;
      if (newTx.type === 'transfer') {
        if (acc.id === newTx.fromAccountId) balanceChange -= newTx.amount;
        if (acc.id === newTx.toAccountId) balanceChange += newTx.amount;
      }
      if (balanceChange !== 0) {
        batch.update(doc(db, `users/${userId}/accounts`, acc.id), { balance: acc.balance + balanceChange });
      }
    });

    await batch.commit();
  },

  async updateTransaction(id: string, updatedFields: Partial<Transaction>, oldTransaction: Transaction, currentAccounts: Account[], currentTransactions: Transaction[]) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");

    const batch = writeBatch(db);
    
    const changes: any[] = [];
    (Object.keys(updatedFields) as (keyof Transaction)[]).forEach((key) => {
      if (updatedFields[key] !== oldTransaction[key] && key !== 'history') {
        changes.push({ field: key, oldValue: oldTransaction[key], newValue: updatedFields[key] });
      }
    });

    const newHistory = changes.length > 0
      ? [...(oldTransaction.history || []), { date: new Date().toISOString(), changes }]
      : oldTransaction.history;

    const newTransaction = { ...oldTransaction, ...updatedFields, history: newHistory };
    
    const updateData: any = { ...updatedFields };
    if (newHistory !== undefined) {
      updateData.history = newHistory;
    }

    // Remove undefined values as Firestore doesn't support them
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    batch.update(doc(db, `users/${userId}/transactions`, id), updateData);

    if (oldTransaction.reimbursedTxIds !== newTransaction.reimbursedTxIds) {
      const oldIds = oldTransaction.reimbursedTxIds || [];
      const newIds = newTransaction.reimbursedTxIds || [];
      const removedIds = oldIds.filter(tid => !newIds.includes(tid));
      const addedIds = newIds.filter(tid => !oldIds.includes(tid));

      removedIds.forEach(tid => {
        batch.update(doc(db, `users/${userId}/transactions`, tid), { isReimbursed: false, reimbursedByTxId: null });
      });
      addedIds.forEach(tid => {
        batch.update(doc(db, `users/${userId}/transactions`, tid), { isReimbursed: true, reimbursedByTxId: id });
      });
    }

    // Revert old transaction effect and apply new transaction effect
    currentAccounts.forEach(acc => {
      let balance = acc.balance;
      // revert
      if (oldTransaction.type === 'expense' && acc.id === oldTransaction.fromAccountId) balance += oldTransaction.amount;
      if (oldTransaction.type === 'income' && acc.id === oldTransaction.toAccountId) balance -= oldTransaction.amount;
      if (oldTransaction.type === 'transfer') {
        if (acc.id === oldTransaction.fromAccountId) balance += oldTransaction.amount;
        if (acc.id === oldTransaction.toAccountId) balance -= oldTransaction.amount;
      }
      // apply
      if (newTransaction.type === 'expense' && acc.id === newTransaction.fromAccountId) balance -= newTransaction.amount;
      if (newTransaction.type === 'income' && acc.id === newTransaction.toAccountId) balance += newTransaction.amount;
      if (newTransaction.type === 'transfer') {
        if (acc.id === newTransaction.fromAccountId) balance -= newTransaction.amount;
        if (acc.id === newTransaction.toAccountId) balance += newTransaction.amount;
      }
      
      if (balance !== acc.balance) {
        batch.update(doc(db, `users/${userId}/accounts`, acc.id), { balance });
      }
    });

    await batch.commit();
  },

  async deleteTransaction(id: string, transaction: Transaction, currentAccounts: Account[], currentTransactions: Transaction[]) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");

    const batch = writeBatch(db);
    batch.delete(doc(db, `users/${userId}/transactions`, id));

    if (transaction.reimbursedTxIds && transaction.reimbursedTxIds.length > 0) {
      transaction.reimbursedTxIds.forEach(tid => {
        batch.update(doc(db, `users/${userId}/transactions`, tid), { isReimbursed: false, reimbursedByTxId: null });
      });
    }

    if (transaction.reimbursedByTxId) {
      const parentTx = currentTransactions.find(t => t.id === transaction.reimbursedByTxId);
      if (parentTx) {
        const newReimbursedIds = parentTx.reimbursedTxIds?.filter(tid => tid !== id) || [];
        batch.update(doc(db, `users/${userId}/transactions`, parentTx.id), { reimbursedTxIds: newReimbursedIds });
      }
    }

    currentAccounts.forEach(acc => {
      let balance = acc.balance;
      if (transaction.type === 'expense' && acc.id === transaction.fromAccountId) balance += transaction.amount;
      if (transaction.type === 'income' && acc.id === transaction.toAccountId) balance -= transaction.amount;
      if (transaction.type === 'transfer') {
        if (acc.id === transaction.fromAccountId) balance += transaction.amount;
        if (acc.id === transaction.toAccountId) balance -= transaction.amount;
      }
      if (balance !== acc.balance) {
        batch.update(doc(db, `users/${userId}/accounts`, acc.id), { balance });
      }
    });

    await batch.commit();
  },

  async markPreviousAsReimbursed(currentTransactions: Transaction[]) {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    const batch = writeBatch(db);
    currentTransactions.forEach(t => {
      if (t.isReimbursable && !t.isReimbursed) {
        batch.update(doc(db, `users/${userId}/transactions`, t.id), { isReimbursed: true });
      }
    });
    await batch.commit();
  },

  // Generic CRUD
  async addDocument(collectionName: string, data: any) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");
    const id = uuidv4();
    const cleanData = { ...data, id, userId };
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined) delete cleanData[key];
    });
    await setDoc(doc(db, `users/${userId}/${collectionName}`, id), cleanData);
  },

  async updateDocument(collectionName: string, id: string, data: any) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");
    const batch = writeBatch(db);
    const cleanData = { ...data };
    Object.keys(cleanData).forEach(key => {
      if (cleanData[key] === undefined) delete cleanData[key];
    });
    batch.update(doc(db, `users/${userId}/${collectionName}`, id), cleanData);
    await batch.commit();
  },

  async deleteDocument(collectionName: string, id: string) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");
    await deleteDoc(doc(db, `users/${userId}/${collectionName}`, id));
  },

  async clearAllData() {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");

    const collections = ['accounts', 'categories', 'transactions', 'budgets', 'templates', 'goals'];
    
    for (const coll of collections) {
      const snapshot = await getDocs(collection(db, `users/${userId}/${coll}`));
      const batches = [];
      let currentBatch = writeBatch(db);
      let count = 0;

      snapshot.docs.forEach((document) => {
        currentBatch.delete(document.ref);
        count++;
        if (count === 400) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
          count = 0;
        }
      });
      
      if (count > 0) {
        batches.push(currentBatch);
      }

      for (const batch of batches) {
        await batch.commit();
      }
    }
  },

  async restoreData(data: any) {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");

    await this.clearAllData();

    const collections = ['accounts', 'categories', 'transactions', 'budgets', 'templates', 'goals'];
    
    for (const coll of collections) {
      if (data[coll] && Array.isArray(data[coll])) {
        const batches = [];
        let currentBatch = writeBatch(db);
        let count = 0;

        data[coll].forEach((item: any) => {
          const id = item.id || uuidv4();
          
          // Sanitize data: remove null, undefined, and empty strings for optional fields
          const cleanItem: any = { id, userId };
          Object.entries(item).forEach(([k, v]) => {
            if (v !== null && v !== undefined && v !== "") {
              cleanItem[k] = v;
            }
          });

          // Prevent 1MB document size limit errors by stripping bulky history data during restore
          if (coll === 'transactions' && cleanItem.history) {
            delete cleanItem.history;
          }

          // Truncate excessively long notes
          if (coll === 'transactions' && cleanItem.note && typeof cleanItem.note === 'string' && cleanItem.note.length > 500) {
            cleanItem.note = cleanItem.note.substring(0, 500);
          }

          currentBatch.set(doc(db, `users/${userId}/${coll}`, id), cleanItem);
          count++;
          if (count === 400) {
            batches.push(currentBatch);
            currentBatch = writeBatch(db);
            count = 0;
          }
        });

        if (count > 0) {
          batches.push(currentBatch);
        }

        for (const batch of batches) {
          await batch.commit();
        }
      }
    }
  }
};
