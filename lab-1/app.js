const uiKinds = {
    ok: "ok",
    loading: "loading",
    error: "error",
};
const state = {
    items: [],
    ui: {
        kind: uiKinds.ok,
        message: "",
    },
    filters: {
        search: "",
        category: "Всі категорії",
        dateSort: "spad"
    },
    idEditing: null
};
const postsBody = document.getElementById('postsBody');
const formSection = document.getElementById('create-post-section');
const statusMessage = document.getElementById('status-message');
const searchInput = document.querySelector('#searchInput');
const filterSelector = document.querySelector('#filterSelector');
const resetBtn = document.getElementById('clear-filters-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const submitBtn = formSection.querySelector('button[type="submit"]');
const dateSort = document.getElementById('dateSort');
const sortArrow = document.getElementById('sortArrow');

// доп функції
function setUI(kind, message = "") {
    state.ui.kind = kind;
    state.ui.message = message;
}
function showError(fieldID, errorFieldID, message) {
    document.getElementById(fieldID).classList.add("error-border");
    document.getElementById(errorFieldID).textContent = message;
}
function clearError(fieldID, errorFieldID) {
    document.getElementById(fieldID).classList.remove("error-border");
    document.getElementById(errorFieldID).textContent = "";
}
function clearAllErrors() {
    const invalidInputs = document.querySelectorAll(".error-border");
    invalidInputs.forEach(input => {
        input.classList.remove("error-border")
    });
    const errorMsgs = document.querySelectorAll(".error-text");
    errorMsgs.forEach(p => {
        p.textContent = "";
    });
}
// render
function render() {
    if (state.ui.kind === uiKinds.loading) {
        statusMessage.hidden = false;
        statusMessage.textContent = state.ui.message || "Завантаження...";
        submitBtn.disabled = true;
        renderList([]);
        return;
    }
    if (state.ui.kind === uiKinds.error) {
        statusMessage.hidden = false;
        statusMessage.textContent = state.ui.message || "Помилка, спробуйте пізніше";
        submitBtn.disabled = false;
        renderList([])
        return;
    }
    let filteredItems = state.items;
    if (state.filters.search) {
        const lowerReg = state.filters.search.toLowerCase();
        filteredItems = filteredItems.filter(item =>
            item.title.toLowerCase().includes(lowerReg)
        );
    }
    if (state.filters.category && state.filters.category !== "Всі категорії") {
        filteredItems = filteredItems.filter(item =>
            item.category === state.filters.category
        );
    }
    filteredItems.sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split('.');
        const dateA = new Date(yearA, monthA - 1, dayA).getTime();

        const [dayB, monthB, yearB] = b.date.split('.');
        const dateB = new Date(yearB, monthB - 1, dayB).getTime();

        if (state.filters.dateSort === "spad") {
            return dateB - dateA;
        } else {
            return dateA - dateB;
        }
    });
statusMessage.hidden = true;
renderList(filteredItems);
}
function renderList(items) {
    postsBody.innerHTML = "";
    if (!items || items.length === 0) {
        postsBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Поки шо список ще порожній.</td></tr>`;
        return;
    }
    const htmlRows = items.map(post => renderItem(post));
    postsBody.innerHTML = htmlRows.join("");
}
function renderItem(item) {
    return `
<tr data-id="${item.id}">
<td>${item.title}</td>
<td><span>${item.category}</span></td>
<td class="col-desc">${item.content}</td>
<td>${item.author}</td>
<td>${item.date}</td>
<td class="col-actions">
    <button type="button" class="action-btn edit-btn" data-action="edit">Редагувати</button>
    <button type="button" class="action-btn delete-btn" data-action="delete">Видалити</button>
    </td>
    </tr>
`;
}
// Обробники подій
function attachHandlers() {
    // submit
    formSection.addEventListener("submit", (event) => {
        event.preventDefault();
        const object = readForm();
        const isValid = validate(object);
        if (isValid) {
            if (state.idEditing) {
                updateItem(object);
                setUI(uiKinds.ok, "Успішно оновлено");
                onCancelEdit();
            } else {
                addItem(object);
                setUI(uiKinds.ok, "Успішно додпно");
            }
            render();
        }
    });
    // delete
    postsBody.addEventListener("click", onListClick);
    // filters
    if (searchInput) {
        searchInput.addEventListener("input", onSearchInput);
    }
    if (filterSelector) {
        filterSelector.addEventListener("change", onCategoryChange);
    }
    if (resetBtn) {
        resetBtn.addEventListener("click", onResetFilters);
    }
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", onCancelEdit);
    }
    if (dateSort) {
        dateSort.addEventListener("click", onDateSort);
    }
}
// чтиання, валідація та додавання у стейт форми
function readForm() {
    return {
        title: formSection.querySelector('#titleInput').value.trim(),
        category: formSection.querySelector('#categorySelect').value,
        content: formSection.querySelector('#messageInput').value.trim(),
        author: formSection.querySelector('#authorInput').value.trim()
    };
}
function validate(object) {
    clearAllErrors();
    let isValid = true;
    if (!object.title || object.title.length > 70) {
        showError("titleInput", "titleError", "Заголовка немає або він більше 70 символів.");
        isValid = false;
    }
    if (!object.category || object.category === "Всі категорії") {
        showError("categorySelect", "categoryError", "Оберіть категорію");
        isValid = false;
    }
    if (object.content.length > 500) {
        showError("messageInput", "contentError", "Не більше 500 символів.");
        isValid = false;
    }
    if (!object.author) {
        showError("authorInput", "authorError", "Вкажіть автора.");
        isValid = false;
    }
    return isValid;
    // додавання/видалення/редагування записів
}
function addItem(object) {
    const newItem = {
        id: crypto.randomUUID(),
        title: object.title,
        category: object.category,
        content: object.content,
        author: object.author,
        date: new Date().toLocaleDateString('uk-UA')
    };
    state.items.push(newItem);
    localStorage.setItem("myItems", JSON.stringify(state.items));
    formSection.querySelector('form').reset();
}
function updateItem(object) {
    const itemIndex = state.items.findIndex(item => item.id === state.idEditing);
    if (itemIndex !== -1) {
        state.items[itemIndex].title = object.title;
        state.items[itemIndex].category = object.category;
        state.items[itemIndex].content = object.content;
        state.items[itemIndex].author = object.author;
    }
    localStorage.setItem("myItems", JSON.stringify(state.items));
    formSection.querySelector('form').reset();
    state.idEditing = null;
}
// Знаходження кнопок видалення/редагування
function onListClick(event) {
    const deleteBtn = event.target.closest('[data-action="delete"]');
    const editBtn = event.target.closest('[data-action="edit"]');
    if (!deleteBtn && !editBtn) return;
    const row = event.target.closest('tr');
    const rowID = row.dataset.id;
    if (!rowID) return;
    if (deleteBtn) {
        state.items = state.items.filter(item => item.id != rowID);
        localStorage.setItem("myItems", JSON.stringify(state.items));
        render();
        return;
    }
    if (editBtn) {
        const itemToEdit = state.items.find(item => item.id === rowID);
        if (!itemToEdit) return;
        clearAllErrors();
        formSection.querySelector('#titleInput').value = itemToEdit.title;
        formSection.querySelector('#categorySelect').value = itemToEdit.category;
        formSection.querySelector('#messageInput').value = itemToEdit.content;
        formSection.querySelector('#authorInput').value = itemToEdit.author;
        state.idEditing = rowID;
        submitBtn.textContent = "Зберегти зміни";
        submitBtn.style.backgroundColor = "yellow";
        submitBtn.style.color = "black";
        if (cancelEditBtn) cancelEditBtn.hidden = false;
        formSection.scrollIntoView();
    }
}
function onSearchInput(event) {
    state.filters.search = event.target.value.trim();
    render();
}
function onCategoryChange(event) {
    state.filters.category = event.target.value;
    render();
}
function onResetFilters() {
    state.filters.search = "";
    state.filters.category = "Всі категорії";
    if (searchInput) searchInput.value = "";
    if (filterSelector) filterSelector.value = "Всі категорії";
    render();
}
function onCancelEdit() {
    formSection.querySelector('form').reset();
    clearAllErrors();
    state.idEditing = null;
    submitBtn.textContent = "Опублікувати";
    submitBtn.style.backgroundColor = "";
    submitBtn.style.color = "";
    if (cancelEditBtn) cancelEditBtn.hidden = true;
}
function onDateSort() {
    if (state.filters.dateSort === "spad") {
        state.filters.dateSort = "zros";
        sortArrow.textContent = "▲";
    } else {
        state.filters.dateSort = "spad";
        sortArrow.textContent = "▼";
    }
    render();
}
// Завантаження з localStorage
function loadDataFromStorage() {
    const savedItems = localStorage.getItem("myItems");
    if (savedItems) {
        state.items = JSON.parse(savedItems)
    }
}
(function init() {
    if (!formSection || !postsBody || !statusMessage) {
        console.error("Помилка знаходження елементів сторінки");
        return;
    }
    loadDataFromStorage();
    attachHandlers();
    render();

})();