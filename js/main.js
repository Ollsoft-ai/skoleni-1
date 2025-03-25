// Inicializace SQL.js
let db;
let dbInitialized = false;

// Načtení SQL.js
initSqlJs({
    locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
}).then(SQL => {
    // Vytvoření nové databáze
    db = new SQL.Database();
    initializeDatabase();
    dbInitialized = true;
}).catch(err => {
    console.error('Chyba při načítání SQL.js:', err);
    alert('Nepodařilo se načíst SQL.js. Zkontrolujte konzoli.');
});

// Funkce pro inicializaci databáze
function initializeDatabase() {
    // Vytvoření tabulky categories
    db.run(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            color TEXT DEFAULT '#4CAF50'
        );
    `);
    
    // Vytvoření tabulky tasks s kategorií
    db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            completed INTEGER DEFAULT 0,
            category_id INTEGER,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        );
    `);
    
    // Zkontrolování, zda tabulka categories obsahuje nějaká data
    const catResult = db.exec("SELECT COUNT(*) as count FROM categories");
    const catCount = catResult[0].values[0][0];
    
    // Pokud je tabulka kategorií prázdná, přidáme vzorové kategorie
    if (catCount === 0) {
        db.run(`
            INSERT INTO categories (name, color) VALUES 
            ('Práce', '#e74c3c'),
            ('Osobní', '#3498db'),
            ('Nákupy', '#f39c12'),
            ('Studium', '#9b59b6');
        `);
    }
    
    // Zkontrolování, zda tabulka tasks obsahuje nějaká data
    const result = db.exec("SELECT COUNT(*) as count FROM tasks");
    const count = result[0].values[0][0];
    
    // Pokud je tabulka úkolů prázdná, přidáme vzorová data
    if (count === 0) {
        db.run(`
            INSERT INTO tasks (title, description, completed, category_id) VALUES 
            ('Dokončit prezentaci', 'Prezentace o AI pro programátory', 0, 1),
            ('Nakoupit potraviny', 'Mléko, chléb, ovoce', 0, 3);
        `);
    }
    
    // Načtení kategorií a úkolů
    loadCategories();
    loadTasks();
}

// Funkce pro načtení úkolů z databáze
function loadTasks() {
    if (!dbInitialized) return;
    
    try {
        // Upravit dotaz pro načtení kategorie společně s úkolem
        const results = db.exec(`
            SELECT t.id, t.title, t.description, t.completed, 
                   t.category_id, c.name as category_name, c.color as category_color
            FROM tasks t
            LEFT JOIN categories c ON t.category_id = c.id
        `);
        
        $('#task-list').empty();
        
        if (results.length === 0) return;
        
        const rows = results[0].values;
        
        rows.forEach(row => {
            const task = {
                id: row[0],
                title: row[1],
                description: row[2],
                completed: row[3] === 1,
                categoryId: row[4],
                categoryName: row[5] || 'Bez kategorie',
                categoryColor: row[6] || '#cccccc'
            };
            
            appendTaskToList(task);
        });
    } catch (err) {
        console.error('Chyba při načítání úkolů:', err);
        alert('Chyba při načítání úkolů.');
    }
}

// Funkce pro přidání nového úkolu
function addTask(title, description, categoryId) {
    if (!dbInitialized) return;
    
    try {
        // Vložení nového úkolu do databáze včetně kategorie
        db.run('INSERT INTO tasks (title, description, completed, category_id) VALUES (?, ?, ?, ?)', 
               [title, description, 0, categoryId || null]);
        
        // Získání ID posledního vloženého záznamu
        const result = db.exec('SELECT last_insert_rowid() as id');
        const taskId = result[0].values[0][0];
        
        // Načtení úkolů znovu pro získání dat o kategorii
        loadTasks();
    } catch (err) {
        console.error('Chyba při přidávání úkolu:', err);
        alert('Nepodařilo se přidat úkol.');
    }
}

// Funkce pro označení úkolu jako dokončeného/nedokončeného
function toggleTaskComplete(taskId, completed) {
    if (!dbInitialized) return;
    
    try {
        db.run('UPDATE tasks SET completed = ? WHERE id = ?', [completed ? 1 : 0, taskId]);
        
        const taskElement = $(`.task-item[data-id="${taskId}"]`);
        
        if (completed) {
            taskElement.addClass('completed');
            taskElement.find('.task-content h3, .task-content p').addClass('task-completed');
            taskElement.find('.complete-btn').text('Označit jako nedokončené');
        } else {
            taskElement.removeClass('completed');
            taskElement.find('.task-content h3, .task-content p').removeClass('task-completed');
            taskElement.find('.complete-btn').text('Označit jako dokončené');
        }
    } catch (err) {
        console.error('Chyba při aktualizaci úkolu:', err);
        alert('Nepodařilo se aktualizovat úkol.');
    }
}

// Funkce pro smazání úkolu
function deleteTask(taskId) {
    if (!dbInitialized) return;
    
    try {
        db.run('DELETE FROM tasks WHERE id = ?', [taskId]);
        $(`.task-item[data-id="${taskId}"]`).remove();
    } catch (err) {
        console.error('Chyba při mazání úkolu:', err);
        alert('Nepodařilo se smazat úkol.');
    }
}

// Pomocná funkce pro přidání úkolu do seznamu
function appendTaskToList(task) {
    const completedClass = task.completed ? 'completed' : '';
    const completedTextClass = task.completed ? 'task-completed' : '';
    const buttonText = task.completed ? 'Označit jako nedokončené' : 'Označit jako dokončené';
    
    const taskHtml = `
        <li class="task-item ${completedClass}" data-id="${task.id}">
            <div class="task-category" style="background-color: ${task.categoryColor}">
                ${escapeHtml(task.categoryName)}
            </div>
            <div class="task-content">
                <h3 class="${completedTextClass}">${escapeHtml(task.title)}</h3>
                <p class="${completedTextClass}">${escapeHtml(task.description || '')}</p>
            </div>
            <div class="task-actions">
                <button class="complete-btn">${buttonText}</button>
                <button class="delete-btn">Smazat</button>
            </div>
        </li>
    `;
    
    $('#task-list').append(taskHtml);
}

// Funkce pro spuštění vlastního SQL dotazu
function executeQuery(sql) {
    if (!dbInitialized) return;
    
    try {
        const startTime = performance.now();
        const results = db.exec(sql);
        const endTime = performance.now();
        
        let output = `Dotaz proveden za ${(endTime - startTime).toFixed(2)} ms\n\n`;
        
        if (results.length === 0) {
            output += 'Dotaz nevrátil žádné výsledky nebo byl proveden příkaz bez výstupu.';
        } else {
            results.forEach(result => {
                // Vytvoření řádku s hlavičkami
                output += result.columns.join('\t') + '\n';
                output += '-'.repeat(result.columns.join('\t').length) + '\n';
                
                // Vytvoření řádků s daty
                result.values.forEach(row => {
                    output += row.join('\t') + '\n';
                });
                
                output += `\nPočet řádků: ${result.values.length}\n`;
            });
        }
        
        // Zobrazení výsledků
        $('#results-area').text(output);
        
        // Aktualizace seznamu úkolů (pro případ, že dotaz změnil data)
        loadTasks();
        
    } catch (err) {
        console.error('Chyba při provádění SQL dotazu:', err);
        $('#results-area').text(`Chyba: ${err.message}`);
    }
}

// Funkce pro export databáze
function exportDatabase() {
    if (!dbInitialized) return;
    
    try {
        // Export databáze do binárního formátu
        const data = db.export();
        const blob = new Blob([data], { type: 'application/x-sqlite3' });
        
        // Vytvoření odkazu pro stažení
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tasktracker.db';
        a.click();
        
        // Uvolnění URL
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
    } catch (err) {
        console.error('Chyba při exportu databáze:', err);
        alert('Nepodařilo se exportovat databázi.');
    }
}

// Funkce pro import databáze
function importDatabase(file) {
    const reader = new FileReader();
    
    reader.onload = function() {
        try {
            // Vytvoření nové databáze z importovaného souboru
            initSqlJs({
                locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
            }).then(SQL => {
                db = new SQL.Database(new Uint8Array(reader.result));
                dbInitialized = true;
                loadTasks();
                alert('Databáze úspěšně načtena.');
            });
        } catch (err) {
            console.error('Chyba při importu databáze:', err);
            alert('Nepodařilo se importovat databázi.');
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// Pomocná funkce pro escapování HTML
function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Funkce pro načtení kategorií z databáze
function loadCategories() {
    if (!dbInitialized) return;
    
    try {
        const results = db.exec("SELECT id, name, color FROM categories");
        
        $('#category-select').empty();
        $('#category-select').append('<option value="">-- Vyberte kategorii --</option>');
        
        if (results.length === 0) return;
        
        const rows = results[0].values;
        
        rows.forEach(row => {
            const category = {
                id: row[0],
                name: row[1],
                color: row[2]
            };
            
            $('#category-select').append(`<option value="${category.id}" data-color="${category.color}">${escapeHtml(category.name)}</option>`);
        });
    } catch (err) {
        console.error('Chyba při načítání kategorií:', err);
    }
}

// Funkce pro přidání nové kategorie
function addCategory(name, color) {
    if (!dbInitialized) return;
    
    try {
        // Vložení nové kategorie do databáze
        db.run('INSERT INTO categories (name, color) VALUES (?, ?)', [name, color]);
        
        // Znovu načíst kategorie
        loadCategories();
        return true;
    } catch (err) {
        console.error('Chyba při přidávání kategorie:', err);
        return false;
    }
}

// Funkce pro smazání kategorie
function deleteCategory(categoryId) {
    if (!dbInitialized) return;
    
    try {
        // Nejprve nastavíme category_id na NULL u všech úkolů, které tuto kategorii používají
        db.run('UPDATE tasks SET category_id = NULL WHERE category_id = ?', [categoryId]);
        
        // Pak smažeme kategorii
        db.run('DELETE FROM categories WHERE id = ?', [categoryId]);
        
        // Znovu načíst kategorie a úkoly
        loadCategories();
        loadTasks();
        return true;
    } catch (err) {
        console.error('Chyba při mazání kategorie:', err);
        return false;
    }
}

// Funkce pro zobrazení dialogu pro správu kategorií
function showCategoryManager() {
    // Vytvořit dialog, pokud ještě neexistuje
    if ($('.category-dialog').length === 0) {
        const dialogHTML = `
            <div class="category-dialog">
                <div class="category-dialog-content">
                    <h2>Správa kategorií</h2>
                    <div class="category-form">
                        <div class="form-group">
                            <label for="category-name">Název kategorie:</label>
                            <input type="text" id="category-name" required>
                        </div>
                        <div class="form-group">
                            <label for="category-color">Barva:</label>
                            <input type="color" id="category-color" value="#4CAF50">
                        </div>
                        <button id="add-category-btn">Přidat kategorii</button>
                    </div>
                    <h3>Existující kategorie</h3>
                    <div class="category-list">
                        <!-- Seznam kategorií bude přidán dynamicky -->
                    </div>
                    <button id="close-category-dialog">Zavřít</button>
                </div>
            </div>
        `;
        
        $('body').append(dialogHTML);
        
        // Event handlers pro dialog
        $('#add-category-btn').on('click', function() {
            const name = $('#category-name').val();
            const color = $('#category-color').val();
            
            if (name.trim() === '') {
                alert('Zadejte název kategorie');
                return;
            }
            
            if (addCategory(name, color)) {
                $('#category-name').val('');
                loadCategoryList();
            }
        });
        
        $('#close-category-dialog').on('click', function() {
            $('.category-dialog').hide();
        });
        
        // Delegování událostí pro tlačítka smazání kategorie
        $('.category-list').on('click', '.delete-category-btn', function() {
            const categoryId = $(this).data('id');
            if (confirm('Opravdu chcete smazat tuto kategorii? Úkoly zůstanou, ale budou bez kategorie.')) {
                if (deleteCategory(categoryId)) {
                    loadCategoryList();
                }
            }
        });
    }
    
    // Načíst seznam kategorií
    loadCategoryList();
    
    // Zobrazit dialog
    $('.category-dialog').show();
}

// Funkce pro načtení seznamu kategorií do dialogu
function loadCategoryList() {
    if (!dbInitialized) return;
    
    try {
        const results = db.exec("SELECT id, name, color FROM categories");
        
        $('.category-list').empty();
        
        if (results.length === 0) {
            $('.category-list').html('<p>Žádné kategorie nebyly nalezeny.</p>');
            return;
        }
        
        const rows = results[0].values;
        
        rows.forEach(row => {
            const category = {
                id: row[0],
                name: row[1],
                color: row[2]
            };
            
            const categoryHTML = `
                <div class="category-item">
                    <div class="category-color" style="background-color: ${category.color}"></div>
                    <div class="category-name">${escapeHtml(category.name)}</div>
                    <button class="delete-category-btn" data-id="${category.id}">Smazat</button>
                </div>
            `;
            
            $('.category-list').append(categoryHTML);
        });
    } catch (err) {
        console.error('Chyba při načítání seznamu kategorií:', err);
    }
}

// Event handler pro načtení dokumentu
$(document).ready(function() {
    // Event handler pro formulář přidání úkolu
    $('#task-form').on('submit', function(e) {
        e.preventDefault();
        
        const title = $('#title').val();
        const description = $('#description').val();
        const categoryId = $('#category-select').val();
        
        if (title.trim() === '') {
            alert('Zadejte název úkolu');
            return;
        }
        
        addTask(title, description, categoryId);
        
        // Resetování formuláře
        $('#title').val('');
        $('#description').val('');
        $('#category-select').val('');
    });
    
    // Event handler pro označení úkolu jako dokončeného/nedokončeného
    $('#task-list').on('click', '.complete-btn', function() {
        const taskId = $(this).closest('.task-item').data('id');
        const isCompleted = $(this).closest('.task-item').hasClass('completed');
        toggleTaskComplete(taskId, !isCompleted);
    });
    
    // Event handler pro smazání úkolu
    $('#task-list').on('click', '.delete-btn', function() {
        const taskId = $(this).closest('.task-item').data('id');
        if (confirm('Opravdu chcete smazat tento úkol?')) {
            deleteTask(taskId);
        }
    });
    
    // Event handler pro správu kategorií
    $('#manage-categories').on('click', function(e) {
        e.preventDefault();
        showCategoryManager();
    });
    
    // Event handler pro spuštění SQL dotazu
    $('#execute-query').on('click', function() {
        const query = $('#sql-query').val();
        executeQuery(query);
    });
    
    // Event handler pro uložení databáze
    $('#save-db').on('click', function() {
        exportDatabase();
    });
    
    // Event handler pro načtení databáze
    $('#load-db').on('click', function() {
        $('#db-file').click();
    });
    
    // Event handler pro výběr souboru databáze
    $('#db-file').on('change', function(e) {
        if (e.target.files.length > 0) {
            importDatabase(e.target.files[0]);
        }
    });
});