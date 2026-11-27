let databasePromise;

const openDatabase = () => {
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open("scan2hire-drafts", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("employee-drafts");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Draft storage is blocked"));
    }).catch((error) => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
};

export const employeeDraft = async (action, key, value) => {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      "employee-drafts",
      action === "get" ? "readonly" : "readwrite"
    );
    const store = transaction.objectStore("employee-drafts");
    const request =
      action === "get"
        ? store.get(key)
        : action === "delete"
          ? store.delete(key)
          : store.put(value, key);
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () =>
      reject(transaction.error || new Error("Draft save was interrupted"));
  });
};
