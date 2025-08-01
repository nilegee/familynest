// qa.js

import { saveToSupabase, deleteFromSupabase } from './storage.js';
import { escapeHtml, generateId, showAlert } from './util.js';
import { notify } from './notifications.js';

// These should be injected by main.js/init
let qaList = [];
let qaListEl = null;
let contentSearch = null;
let askBtn = null;
let newQuestionInput = null;
let adminUsers = [];
let currentUserKey = 'familyCurrentUser';
let questionSelect = null;
let adminAnswerSection = null;
let answerInput = null;
let saveAnswerBtn = null;

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
  qaListEl = qaListElRef || document.getElementById('qaList');
  contentSearch = contentSearchRef || document.getElementById('contentSearch');
  askBtn = askBtnRef || document.getElementById('askBtn');
  newQuestionInput = newQuestionInputRef || document.getElementById('newQuestion');
  adminUsers = adminUsersRef || [];
  currentUserKey = currentUserKeyRef || 'familyCurrentUser';
  questionSelect = questionSelectRef || document.getElementById('questionSelect');
  adminAnswerSection = adminAnswerSectionRef || document.getElementById('adminAnswerSection');
  answerInput = answerInputRef || document.getElementById('answerInput');
  saveAnswerBtn = saveAnswerBtnRef || document.getElementById('saveAnswerBtn');

  setupQAListeners();
  renderQA();
}

export function renderQA(filterText = '') {
  // Defensive: only run if element exists!
  qaListEl = qaListEl || document.getElementById('qaList');
  if (!qaListEl) return;

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
  if (askBtn) {
    askBtn.addEventListener('click', () => {
      const q = newQuestionInput?.value.trim();
      if (!q) {
        showAlert('Please enter your question.');
        return;
      }
      const id = generateId();
      const item = { id, q, a: '' };
      qaList.unshift(item);
      saveToSupabase('qa_table', item);
      if (newQuestionInput) newQuestionInput.value = '';
      renderQA(contentSearch?.value || '');
      notify('qa', 'New question', q);
    });
  }

  if (qaListEl) {
    qaListEl.addEventListener('click', async (e) => {
      const li = e.target.closest('li');
      if (!li) return;
      const id = li.getAttribute('data-id');
      const index = qaList.findIndex(item => item.id === id);
      if (index === -1) return;

      const delBtn = e.target.closest('.delete-q-btn');
      const editBtn = e.target.closest('.edit-q-btn');

      if (delBtn) {
        if (confirm('Delete this question?')) {
          const [removed] = qaList.splice(index, 1);
          await deleteFromSupabase('qa_table', removed.id);
          renderQA(contentSearch?.value || '');
        }
      } else if (editBtn) {
        enterQAEditMode(id);
      }
    });
  }

  if (saveAnswerBtn) {
    saveAnswerBtn.addEventListener('click', () => {
      const selected = questionSelect?.value;
      const answer = answerInput?.value.trim();
      if (!selected || !answer) {
        showAlert('Select a question and type an answer.');
        return;
      }
      const qaItem = qaList.find(item => item.id === selected);
      if (qaItem) {
        qaItem.a = answer;
        saveToSupabase('qa_table', qaItem);
        if (answerInput) answerInput.value = '';
        renderQA(contentSearch?.value || '');
        notify('answer', 'New answer', qaItem.q);
      }
    });
  }
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
    saveToSupabase('qa_table', qaItem);
    renderQA(contentSearch?.value || '');
  });
  cancelBtn.addEventListener('click', () => {
    renderQA(contentSearch?.value || '');
  });
  qEdit.focus();
}

function renderAdminQuestionOptions() {
  if (!questionSelect) return;
  questionSelect.innerHTML = '';
  if (!Array.isArray(qaList)) return;
  qaList.filter(item => !item.a).forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.q;
    questionSelect.appendChild(option);
  });
  if (adminAnswerSection) {
    adminAnswerSection.hidden = questionSelect.options.length === 0;
  }
}
