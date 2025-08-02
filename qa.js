// qa.js

import { saveToSupabase, deleteFromSupabase } from './storage.js';
import { escapeHtml, generateId, showAlert, formatDateLocal, timeAgo } from './util.js';
import { notify } from './notifications.js';

// These should be injected by main.js/init
let qaList = [];
let qaListEl = null;
let contentSearch = null;
let askBtn = null;
let newQuestionInput = null;
let adminUsers = [];
let questionOnlyUsers = [];
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
  questionOnlyUsersRef,
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
  questionOnlyUsers = questionOnlyUsersRef || [];
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
    const currentUser = localStorage.getItem(currentUserKey);
    const canModify = adminUsers.includes(currentUser) && !questionOnlyUsers.includes(currentUser);
    const qUser = item.qBy || 'Unknown';
    const qAvatar = (window.profilesData && window.profilesData[qUser] && window.profilesData[qUser].avatar) || 'icons/default-avatar.svg';
    const qDate = item.qDate ? `<span class="qa-date" title="${formatDateLocal(item.qDate)}">${timeAgo(item.qDate)}</span>` : '';
    const qMeta = `<div class="qa-meta"><img src="${qAvatar}" alt="${escapeHtml(qUser)} avatar" class="avatar-qa"><span class="qa-user">${escapeHtml(qUser)}</span>${qDate}</div>`;
    let answerHtml;
    if (item.a) {
      const aUser = item.aBy || 'Unknown';
      const aAvatar = (window.profilesData && window.profilesData[aUser] && window.profilesData[aUser].avatar) || 'icons/default-avatar.svg';
      const aDate = item.aDate ? `<span class="qa-date" title="${formatDateLocal(item.aDate)}">${timeAgo(item.aDate)}</span>` : '';
      const aMeta = `<div class="qa-meta"><img src="${aAvatar}" alt="${escapeHtml(aUser)} avatar" class="avatar-qa"><span class="qa-user">${escapeHtml(aUser)}</span>${aDate}</div>`;
      answerHtml = `${aMeta}<div class="qa-answer">A: ${escapeHtml(item.a)}</div>`;
    } else {
      answerHtml = `<div class="qa-answer"><i>Waiting for answer...</i></div>`;
    }
    li.innerHTML = `
      ${qMeta}
      <div class="qa-question">Q: ${escapeHtml(item.q)}</div>
      ${answerHtml}
      ${canModify ? `
      <div class="qa-actions">
        <button class="edit-q-btn" aria-label="Edit question"><i class="fa-solid fa-pen-to-square"></i></button>
        <button class="delete-q-btn" aria-label="Delete question"><i class="fa-solid fa-trash"></i></button>
      </div>` : ''}
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
      const currentUser = localStorage.getItem(currentUserKey);
      if (!currentUser) {
        showAlert('Please select your user first.');
        return;
      }
      const id = generateId();
      const item = { id, q, a: '', qBy: currentUser, qDate: new Date().toISOString() };
      qaList.unshift(item);
      saveToSupabase('qa_table', item);
      if (newQuestionInput) newQuestionInput.value = '';
      renderQA(contentSearch?.value || '');
      notify('qa', 'New question', q);
    });
  }

  if (qaListEl) {
    qaListEl.addEventListener('click', async (e) => {
      const currentUser = localStorage.getItem(currentUserKey);
      if (!adminUsers.includes(currentUser) || questionOnlyUsers.includes(currentUser)) return;
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
      const currentUser = localStorage.getItem(currentUserKey);
      if (!adminUsers.includes(currentUser) || questionOnlyUsers.includes(currentUser)) return;
      const selected = questionSelect?.value;
      const answer = answerInput?.value.trim();
      if (!selected || !answer) {
        showAlert('Select a question and type an answer.');
        return;
      }
      const qaItem = qaList.find(item => item.id === selected);
      if (qaItem) {
        qaItem.a = answer;
        qaItem.aBy = currentUser;
        qaItem.aDate = new Date().toISOString();
        saveToSupabase('qa_table', qaItem);
        if (answerInput) answerInput.value = '';
        renderQA(contentSearch?.value || '');
        notify('answer', 'New answer', qaItem.q);
      }
    });
  }
}

function enterQAEditMode(id) {
  const currentUser = localStorage.getItem(currentUserKey);
  if (!adminUsers.includes(currentUser) || questionOnlyUsers.includes(currentUser)) return;
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
    if (newA) {
      qaItem.aBy = currentUser;
      qaItem.aDate = new Date().toISOString();
    }
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
