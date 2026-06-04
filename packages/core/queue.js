/**
 * DSM — Core Queue Manager
 * Provides a simple async queue for controlling concurrency
 * during parallel page extraction.
 */

/**
 * Runs async tasks with a bounded concurrency limit.
 * @param {Array<() => Promise<any>>} tasks - Array of async task factories.
 * @param {number} concurrency - Max simultaneous tasks (default: 5).
 * @returns {Promise<Array<{status: string, value?: any, reason?: any}>>}
 */
async function runQueue(tasks, concurrency = 5) {
  const results = [];
  const executing = new Set();

  for (const task of tasks) {
    const promise = Promise.resolve().then(task).then(
      (value) => ({ status: 'fulfilled', value }),
      (reason) => ({ status: 'rejected', reason })
    );

    results.push(promise);
    executing.add(promise);

    promise.finally(() => executing.delete(promise));

    if (executing.size >= concurrency) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

module.exports = { runQueue };
