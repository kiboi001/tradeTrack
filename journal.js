// Inside the renderJournalTable() function loop:
row.innerHTML = `
    // ... other trade data columns
    <td>
        <button class="edit-btn" data-id="${trade.id}">Edit</button>
        <button class="delete-btn" data-id="${trade.id}">Delete</button>
    </td>
`;

const journalTableBody = document.querySelector('#journal-table-body');