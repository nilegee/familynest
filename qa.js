// qa.js

import { saveToSupabase } from './storage.js';
import { escapeHtml, generateId, showAlert } from './util.js';

// These should be injected by main.js/init
let qaList = [];
let qaListEl;
let contentSearch;
let askBtn;
let newQuestionInput;
let adminUsers;
let currentUserKey;
let questionSelect;
let adminAnswerSection;
let answerInput;
let saveAnswerBtn;

export function setupQA({
  qaListRef,
  qaListElRef,
  contentSearchRef,
  askBtnRef,
  newQuestionInputRef,
  adminUsersRef,
  currentUserKeyRef,
  questionSelectRef,
  adminAnswerSectionRef,
  answerInputRef,
  saveAnswerBtnRef
}) {
  qaList = qaListRef;
  qaListEl = qaListElRef;
  contentSearch = contentSearchRef;
  askBtn = askBtnRef;
  newQuestionInput = newQuestionInputRef;
  adminUsers = adminUsersRef;
  currentUserKey = currentUserKeyRef;
  questionSelect = questionSelectRef;
  adminAnswerSection = adminAnswerSectionRef;
  answerInput = answerInputRef;
  saveAnswerBtn = saveAnswerBtnRef;

  setupQAListeners();
  renderQA();
}

export function renderQA(filterText = '') {
  qaListEl.innerHTML = '';
  const list = Array.isArray(qaList) ? qaList : [];
  let filtered = list;
  if (filterText) {
    const f = filterText.toLowerCase();
    filtered = list.filter(item =>
      item.q.toLowerCase().includes(f) ||
      (item.a && item.a.toLowerCase().includes(f))
    );
  }
  filtered.forEach(item => {
    const li = document.createElement('li');
    li.setAttribute('data-id', item.id);
    li.setAttribute('tabindex', '0');
    li.innerHTML = `
      <div class="qa-question">Q: ${escapeHtml(item.q)}</div>
      <div class="qa-answer">${item.a ? `A: ${escapeHtml(item.a)}` : '<i>Waiting for answer...</i>'}</div>
      <div class="qa-actions">
        <button class="edit-q-btn" aria-label="Edit question"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="delete-q-btn" aria-label="Delete question"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    qaListEl.appendChild(li);
  });
  renderAdminQuestionOptions();
}

function setupQAListeners() {
  askBtn.addEventListener('click', () => {
    const q = newQuestionInput.value.trim();
    if (!q) {
      showAlert('Please enter your question.');
      return;
    }
    const id = generateId();
    qaList.unshift({ id, q, a: '' });
    saveToSupabase('qa_table', qaList);
    newQuestionInput.value = '';
    renderQA(contentSearch.value);
  });

  qaListEl.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    const id = li.getAttribute('data-id');
    const index = qaList.findIndex(item => item.id === id);
    if (index === -1) return;

    if (e.target.classList.contains('delete-q-btn')) {
      if (confirm('Delete this question?')) {
        qaList.splice(index, 1);
        saveToSupabase('qa_table', qaList);
        renderQA(contentSearch.value);
      }
    } else if (e.target.classList.contains('edit-q-btn')) {
      enterQAEditMode(id);
    }
  });

  saveAnswerBtn.addEventListener('click', () => {
    const selected = questionSelect.value;
    const answer = answerInput.value.trim();
    if (!selected || !answer) {
      showAlert('Select a question and type an answer.');
      return;
    }
    const qaItem = qaList.find(item => item.id === selected);
    qaItem.a = answer;
    saveToSupabase('qa_table', qaList);
    answerInput.value = '';
    renderQA(contentSearch.value);
  });
}

function enterQAEditMode(id) {
  const li = qaListEl.querySelector(`li[data-id="${id}"]`);
  if (!li) return;
  const qaItem = qaList.find(item => item.id === id);
  li.innerHTML = `
    <textarea class="qa-edit-question" aria-label="Edit question">${escapeHtml(qaItem.q)}</textarea>
    <textarea class="qa-edit-answer" aria-label="Edit answer">${qaItem.a ? escapeHtml(qaItem.a) : ''}</textarea>
    <div class="qa-edit-actions">
      <button class="save-qa-btn">Save</button>
      <button class="cancel-qa-btn">Cancel</button>
    </div>
  `;
  const qEdit = li.querySelector('.qa-edit-question');
  const aEdit = li.querySelector('.qa-edit-answer');
  const saveBtn = li.querySelector('.save-qa-btn');
  const cancelBtn = li.querySelector('.cancel-qa-btn');

  saveBtn.addEventListener('click', () => {
    const newQ = qEdit.value.trim();
    const newA = aEdit.value.trim();
    if (!newQ) {
      showAlert('Question cannot be empty.');
      return;
    }
    qaItem.q = newQ;
    qaItem.a = newA;
    saveToSupabase('qa_table', qaList);
    renderQA(contentSearch.value);
  });
  cancelBtn.addEventListener('click', () => {
    renderQA(contentSearch.value);
  });
  qEdit.focus();
}

function renderAdminQuestionOptions() {
  questionSelect.innerHTML = '';
  if (!Array.isArray(qaList)) return;
  qaList.filter(item => !item.a).forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.q;
    questionSelect.appendChild(option);
  });
  adminAnswerSection.hidden = questionSelect.options.length === 0;
}
