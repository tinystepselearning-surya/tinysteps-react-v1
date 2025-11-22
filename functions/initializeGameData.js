// Game data initialization has been removed from this repository.
// The original initializer that seeded gameData documents was removed
// as part of the effort to delete kid games and their data.
// This file remains as a safe stub to avoid accidental runtime errors
// if callers still reference `initializeGameData`.

async function initializeGameData() {
  return {
    success: false,
    message: 'initializeGameData has been removed. Game seeding is disabled in this deployment.'
  };
}

module.exports = { initializeGameData };
