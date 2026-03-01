import type Database from 'better-sqlite3';
import { advanceDate } from '$lib/calendar';

export function seedAll(db: Database.Database) {
  const tx = db.transaction(() => {
    // Shareholders (shares total 100)
    const insertShareholder = db.prepare('INSERT OR IGNORE INTO shareholders (name, shares) VALUES (?, ?)');
    insertShareholder.run('Renaer Neverember', 40);
    insertShareholder.run('Vajra Safahr', 25);
    insertShareholder.run('Floon Blagmaar', 20);
    insertShareholder.run('Durnan', 15);

    // Rooms
    const insertRoom = db.prepare('INSERT OR IGNORE INTO rooms (name, floor, rate, description) VALUES (?, ?, ?, ?)');
    insertRoom.run('The Hearth Suite', 2, 8, 'Spacious room with fireplace and bay window');
    insertRoom.run('Attic Nook', 3, 3, 'Cozy garret room under the eaves');
    insertRoom.run('Garden Room', 1, 5, 'Ground floor room overlooking the back garden');
    insertRoom.run('Tower Chamber', 3, 6, 'Round room in the corner turret');
    insertRoom.run('Cellar Bunk', 0, 2, 'Simple cot in the dry cellar');

    // Loans
    const insertLoan = db.prepare(
      'INSERT INTO loans (lender, principal, interest_rate, start_date, term_days, status) VALUES (?, ?, ?, ?, ?, ?)'
    );
    insertLoan.run('Mirt the Moneylender', 2500, 0.04, '1492-01-01', 360, 'active');
    insertLoan.run('Istrid Horn', 1000, 0.06, '1492-01-15', 180, 'active');

    // Assets
    const insertAsset = db.prepare(
      'INSERT INTO assets (name, purchase_date, cost, useful_life_days, salvage_value, description) VALUES (?, ?, ?, ?, ?, ?)'
    );
    insertAsset.run('Bar Counter', '1492-01-01', 200, 1800, 20, 'Polished darkwood bar top');
    insertAsset.run('Brewing Kettle', '1492-01-01', 150, 1200, 15, 'Copper kettle for ales and meads');
    insertAsset.run('Tavern Sign', '1492-01-05', 50, 900, 5, 'Carved wooden sign with gilded letters');
    insertAsset.run('Kitchen Stove', '1492-01-01', 300, 2400, 30, 'Cast-iron stove with double oven');

    // Events
    const insertEvent = db.prepare(
      'INSERT INTO events (name, date_dr, revenue, cost, description) VALUES (?, ?, ?, ?, ?)'
    );
    insertEvent.run('Bard Night', '1492-01-10', 45, 10, 'Open mic night with free appetizers');
    insertEvent.run('Arm Wrestling Tournament', '1492-01-20', 30, 5, 'Entry fee tournament with ale prizes');
    insertEvent.run('Wine Tasting', '1492-03-05', 60, 25, 'Sampling wines from the Sword Coast');

    // Transactions — spread across several months
    const insertTx = db.prepare(
      'INSERT INTO transactions (date_dr, description, amount, category, person, notes) VALUES (?, ?, ?, ?, ?, ?)'
    );

    // Loan receipts
    insertTx.run('1492-01-01', 'Loan from Mirt the Moneylender', 2500, 'loan', 'Mirt the Moneylender', 'Principal received');
    insertTx.run('1492-01-15', 'Loan from Istrid Horn', 1000, 'loan', 'Istrid Horn', 'Principal received');

    // Owner's equity injection
    insertTx.run('1492-01-01', 'Capital injection from Renaer Neverember', 500, "Owner's Equity", 'Renaer Neverember', 'Initial investment');

    // Asset purchases
    insertTx.run('1492-01-01', 'Purchase: Bar Counter', -200, 'asset', null, null);
    insertTx.run('1492-01-01', 'Purchase: Brewing Kettle', -150, 'asset', null, null);
    insertTx.run('1492-01-05', 'Purchase: Tavern Sign', -50, 'asset', null, null);
    insertTx.run('1492-01-01', 'Purchase: Kitchen Stove', -300, 'asset', null, null);

    // Daily income — generate ~60 transactions over first 3 months
    let date = '1492-01-02';
    const descriptions = [
      { desc: 'Ale & mead sales', min: 5, max: 15, cat: 'tavern' },
      { desc: 'Food & board', min: 3, max: 10, cat: 'tavern' },
    ];
    for (let d = 0; d < 60; d++) {
      const item = descriptions[d % 2];
      const amount = item.min + (d * 7 + 3) % (item.max - item.min + 1);
      insertTx.run(date, item.desc, amount, item.cat, null, null);

      // Every 10 days, add wages expense
      if (d % 10 === 9) {
        insertTx.run(date, 'Staff wages', -25, 'wages', null, 'Barkeep and cook');
      }

      // Every 30 days, add supplies expense
      if (d % 30 === 29) {
        insertTx.run(date, 'Monthly supplies', -40, 'supplies', null, 'Ale barrels, flour, firewood');
      }

      date = advanceDate(date, 1);
    }

    // Event transactions
    insertTx.run('1492-01-10', 'Bard Night revenue', 45, 'event', null, null);
    insertTx.run('1492-01-10', 'Bard Night costs', -10, 'event', null, null);
    insertTx.run('1492-01-20', 'Arm Wrestling revenue', 30, 'event', null, null);
    insertTx.run('1492-01-20', 'Arm Wrestling costs', -5, 'event', null, null);
    insertTx.run('1492-03-05', 'Wine Tasting revenue', 60, 'event', null, null);
    insertTx.run('1492-03-05', 'Wine Tasting costs', -25, 'event', null, null);

    // Bookings with Waterdhavian NPCs
    const rooms = db.prepare('SELECT id, rate FROM rooms').all() as { id: number; rate: number }[];
    const insertBooking = db.prepare(
      'INSERT INTO bookings (room_id, guest_name, check_in, check_out, rate, paid, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    if (rooms.length >= 5) {
      insertBooking.run(rooms[0].id, 'Volothamp Geddarm', '1492-01-08', '1492-01-12', rooms[0].rate, 1, 'Researching a new book');
      insertBooking.run(rooms[1].id, 'Yagra Stonefist', '1492-01-15', '1492-01-18', rooms[1].rate, 1, 'In town for the arena');
      insertBooking.run(rooms[2].id, 'Laeral Silverhand', '1492-03-01', '1492-03-05', rooms[2].rate, 0, 'Official city business');
      insertBooking.run(rooms[3].id, 'Hlam the Monk', '1492-03-10', '1492-03-12', rooms[3].rate, 0, 'Meditation retreat');
      insertBooking.run(rooms[4].id, 'Xanathar\'s Agent', '1492-04-01', '1492-04-03', rooms[4].rate, 0, 'Suspicious guest');
      insertBooking.run(rooms[0].id, 'Mirt the Moneylender', '1492-04-10', '1492-04-15', rooms[0].rate, 0, 'Checking on his investment');
    }
  });

  tx();
}

export function clearAll(db: Database.Database) {
  const tx = db.transaction(() => {
    db.exec('DELETE FROM loan_payments');
    db.exec('DELETE FROM transactions');
    db.exec('DELETE FROM bookings');
    db.exec('DELETE FROM events');
    db.exec('DELETE FROM loans');
    db.exec('DELETE FROM assets');
    db.exec('DELETE FROM shareholders');
    db.exec('DELETE FROM rooms');
    db.exec('DELETE FROM game_state');
    // Re-insert defaults
    db.exec("INSERT INTO game_state (key, value) VALUES ('current_date', '1492-01-01')");
    db.exec("INSERT INTO game_state (key, value) VALUES ('full_moon_date', '1492-01-01')");
  });

  tx();
}
