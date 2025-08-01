// calendar.js

import { saveToSupabase, deleteFromSupabase } from './storage.js';
import { generateId, showAlert } from './util.js';

let calendarEvents = [];
let calendarBody;
let eventListEl;
let contentSearch;
let eventStartDate;
let eventEndDate;
let eventDesc;
let addEventBtn;

export function setupCalendar({
  calendarEventsRef,
  calendarBodyRef,
  eventListElRef,
  contentSearchRef,
  eventStartDateRef,
  eventEndDateRef,
  eventDescRef,
  addEventBtnRef
}) {
  calendarEvents = calendarEventsRef;
  calendarBody = calendarBodyRef;
  eventListEl = eventListElRef;
  contentSearch = contentSearchRef;
  eventStartDate = eventStartDateRef;
  eventEndDate = eventEndDateRef;
  eventDesc = eventDescRef;
  addEventBtn = addEventBtnRef;

  if (addEventBtn) addEventBtn.addEventListener('click', addCalendarEvent);
  if (calendarBody) calendarBody.addEventListener('click', calendarTableClickHandler);
  if (eventListEl) eventListEl.addEventListener('click', eventListClickHandler);

  renderCalendarTable();
  renderCalendarEventsList();
}

export function renderCalendarTable() {
  // Defensive: Bail if the calendar body is missing
  calendarBody = document.getElementById('calendarBody');
  if (!calendarBody) return;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  calendarBody.innerHTML = '';
  let day = 1;
  for (let r = 0; r < 6; r++) {
    const row = document.createElement('tr');
    for (let c = 0; c < 7; c++) {
      const cell = document.createElement('td');
      cell.style.padding = '6px';
      cell.style.border = '1px solid #ddd';
      cell.style.textAlign = 'center';
      if (r === 0 && c < startDay) {
        cell.textContent = '';
      } else if (day > daysInMonth) {
        cell.textContent = '';
      } else {
        cell.textContent = day;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        cell.setAttribute('data-date', dateStr);
        day++;
      }
      row.appendChild(cell);
    }
    calendarBody.appendChild(row);
  }
}

export function renderCalendarEventsList(filterDesc = '') {
  eventListEl = document.getElementById('eventList');
  if (!eventListEl) return;
  eventListEl.innerHTML = '';
  const events = Array.isArray(calendarEvents) ? calendarEvents : [];
  let filtered = events;
  if (filterDesc) {
    const f = filterDesc.toLowerCase();
    filtered = events.filter(ev => ev.desc.toLowerCase().includes(f));
  }
  filtered.forEach(ev => {
    const li = document.createElement('li');
    li.setAttribute('data-id', ev.id);
    li.setAttribute('tabindex', '0');
    li.innerHTML = `<span>${ev.start}${ev.end && ev.end !== ev.start ? '–' + ev.end : ''}: ${ev.desc}</span>
      <button class="edit-event-btn">✏️</button>
      <button class="delete-event-btn">🗑️</button>`;
    eventListEl.appendChild(li);
  });
}

function addCalendarEvent() {
  const start = eventStartDate.value;
  const end = eventEndDate.value;
  const desc = eventDesc.value.trim();
  if (!start || !desc) {
    showAlert('Start date and description are required.');
    return;
  }
  if (end && new Date(end) < new Date(start)) {
    showAlert('End date cannot be before start date.');
    return;
  }
  const overlap = calendarEvents.some(ev =>
    (start <= ev.end && (end || start) >= ev.start)
  );
  if (overlap) {
    showAlert('Event overlaps with an existing one.');
    return;
  }
  const newEvent = { id: generateId(), start, end: end || start, desc };
  calendarEvents.push(newEvent);
  saveToSupabase('calendar_events', newEvent);
  eventStartDate.value = '';
  eventEndDate.value = '';
  eventDesc.value = '';
  renderCalendarEventsList(contentSearch ? contentSearch.value : '');
  renderCalendarTable();
}

function calendarTableClickHandler(e) {
  const cell = e.target.closest('td[data-date]');
  if (!cell) return;
  const date = cell.getAttribute('data-date');
  const filtered = calendarEvents.filter(ev => ev.start <= date && ev.end >= date);
  if (filtered.length) {
    const msg = filtered.map(ev => `${ev.desc} (${ev.start}${ev.end && ev.end !== ev.start ? '–' + ev.end : ''})`).join('\n');
    alert(msg);
  }
}

async function eventListClickHandler(e) {
  const li = e.target.closest('li[data-id]');
  if (!li) return;
  const id = li.getAttribute('data-id');
  const idx = calendarEvents.findIndex(ev => ev.id === id);
  if (idx === -1) return;

  if (e.target.classList.contains('delete-event-btn')) {
    if (confirm('Delete this event?')) {
      calendarEvents.splice(idx, 1);
      await deleteFromSupabase('calendar_events', id);
      renderCalendarEventsList(contentSearch ? contentSearch.value : '');
      renderCalendarTable();
    }
  } else if (e.target.classList.contains('edit-event-btn')) {
    const ev = calendarEvents[idx];
    const desc = prompt('Event description:', ev.desc) || ev.desc;
    const start = prompt('Start date (YYYY-MM-DD):', ev.start) || ev.start;
    const end = prompt('End date (YYYY-MM-DD):', ev.end) || ev.end;
    ev.desc = desc.trim();
    ev.start = start;
    ev.end = end;
    saveToSupabase('calendar_events', ev);
    renderCalendarEventsList(contentSearch ? contentSearch.value : '');
    renderCalendarTable();
  }
}
