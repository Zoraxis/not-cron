export const stats_page = (req, res) => {
    res.send(`
        <div>
          <h1>Notto</h1>
          <br/>
          <br/>
          <h3>Connected Users</h3>
          <table id="connected-users">
            <tr>
              <th>Socket ID</th>
              <th>Address</th>
            </tr>
          </table>
          <br/>
          <h3>Games</h3>
          <table id="games">
            <tr>
              <th>Game</th>
              <th>Players</th>
              <th>Prize</th>
            </tr>
          </table>
          <br/>
          <h3>History</h3>
          <table id="history">
            <tr>
              <th>Game</th>
              <th>History</th>
            </tr>
          </table>
          <br/>
          <h3>Wallets to Disconnect</h3>
          <table id="wallets-to-disconnect">
            <tr>
              <th>Socket ID</th>
            </tr>
          </table>
        </div>
        <script>
          const updateData = async () => {
            const response = await fetch('/api/status');
            const data = await response.json();
  
            const connectedUsersTable = document.getElementById('connected-users');
            connectedUsersTable.innerHTML = '<tr><th>Socket ID</th><th>Address</th></tr>';
            data.connectedUsers.forEach(user => {
              const row = connectedUsersTable.insertRow();
              row.insertCell(0).innerText = user.id || '';
              row.insertCell(1).innerText = user.address || '';
            });
  
            const gamesTable = document.getElementById('games');
            gamesTable.innerHTML = '<tr><th>Game</th><th>Players</th><th>Prize</th></tr>';
            Object.keys(data.games).forEach(gameId => {
              const game = data.games[gameId];
              const row = gamesTable.insertRow();
              row.insertCell(0).innerText = gameId;
              row.insertCell(1).innerText = game.players?.length || 0;
              row.insertCell(2).innerText = game.prize || 0;
            });
  
            const historyTable = document.getElementById('history');
            historyTable.innerHTML = '<tr><th>Game</th><th>History</th></tr>';
            data.history.forEach((history, index) => {
              const row = historyTable.insertRow();
              row.insertCell(0).innerText = index + 1;
              row.insertCell(1).innerText = history;
            });
  
            const walletsTable = document.getElementById('wallets-to-disconnect');
            walletsTable.innerHTML = '<tr><th>Socket ID</th></tr>';
            data.walletsToDisconnect.forEach(wallet => {
              const row = walletsTable.insertRow();
              row.insertCell(0).innerText = wallet.id || '';
            });
          };
  
          setInterval(updateData, 5000); // Update every 5 seconds
          updateData(); // Initial load
        </script>
      `);
    }