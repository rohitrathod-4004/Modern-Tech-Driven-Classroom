import mongoose from 'mongoose';

/**
 * Executes a MongoDB transaction. If the database is a standalone instance
 * (not a replica set), it falls back to executing the operations sequentially
 * without a transaction to prevent local development crashes.
 */
export async function withTransactionFallback<T>(
  action: (session: mongoose.ClientSession | undefined) => Promise<T>
): Promise<T> {
  let session: mongoose.ClientSession | undefined;
  
  try {
    session = await mongoose.startSession();
  } catch (e) {
    // If session cannot even start, just run without it
    console.warn('[MongoDB] Could not start session. Running without transaction.');
    return await action(undefined);
  }

  let result: T;
  
  try {
    await session.withTransaction(async () => {
      result = await action(session);
    });
    return result!;
  } catch (error: any) {
    // Error 20: IllegalOperation is thrown when transaction numbers are used on standalone mongod
    if (
      error.code === 20 || 
      error.codeName === 'IllegalOperation' || 
      (error.message && error.message.toLowerCase().includes('replica set')) ||
      (error.message && error.message.toLowerCase().includes('retryable writes'))
    ) {
      console.warn('[MongoDB] Transactions not supported on this deployment (standalone). Executing without transaction.');
      return await action(undefined);
    }
    throw error;
  } finally {
    await session.endSession();
  }
}
