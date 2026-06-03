const tg = window.Telegram.WebApp;

// Initialize Telegram Web App
tg.ready();
tg.expand();

if (tg.colorScheme === 'dark') {
    document.body.classList.add('dark');
}

// Global State
let moviesState = [];
let activeMovieIdx = null;
let activeScheduleIdx = null;
let currentCalendarDate = new Date();

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// 1. Initial State Loading from Query Params
const urlParams = new URLSearchParams(window.location.search);
const dataParam = urlParams.get('data');
const moviesParam = urlParams.get('movies');

if (dataParam) {
    try {
        // Decode URL-encoded JSON structure
        const parsed = JSON.parse(decodeURIComponent(dataParam));
        if (parsed && Array.isArray(parsed.movies)) {
            moviesState = parsed.movies;
        } else if (Array.isArray(parsed)) {
            moviesState = parsed;
        }
    } catch (e) {
        console.error("Failed to parse data parameter:", e);
    }
}

// Fallback to old movies param if data is not present/valid
if (moviesState.length === 0 && moviesParam) {
    try {
        const titles = decodeURIComponent(moviesParam).split(',');
        titles.forEach(title => {
            if (title.trim()) {
                moviesState.push({
                    title: title.trim(),
                    date_time: []
                });
            }
        });
    } catch (e) {
        console.error("Failed to parse movies parameter:", e);
    }
}

// 2. Render State Loop
const moviesContainer = document.getElementById('movies-container');

function renderState() {
    moviesContainer.innerHTML = '';

    moviesState.forEach((movie, movieIdx) => {
        const movieGroup = document.createElement('div');
        movieGroup.className = 'movie-group';
        movieGroup.dataset.idx = movieIdx;

        // Movie Header Row
        const movieHeaderRow = document.createElement('div');
        movieHeaderRow.className = 'movie-header-row';

        // Movie Header Box
        const movieHeader = document.createElement('div');
        movieHeader.className = 'movie-header';

        // Film Icon SVG (movie_24dp)
        movieHeader.innerHTML = `
            <svg class="icon" viewBox="0 -960 960 960">
                <path d="m160-800 65 130q7 14 20 22t28 8q30 0 46-25.5t2-52.5l-41-82h80l65 130q7 14 20 22t28 8q30 0 46-25.5t2-52.5l-41-82h80l65 130q7 14 20 22t28 8q30 0 46-25.5t2-52.5l-41-82h120q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800Zm0 240v320h640v-320H160Zm0 0v320-320Z"/>
            </svg>
        `;

        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.className = 'movie-title-input';
        titleInput.value = movie.title || '';
        titleInput.placeholder = 'Enter movie title';
        titleInput.addEventListener('input', (e) => {
            movie.title = e.target.value;
        });
        movieHeader.appendChild(titleInput);
        movieHeaderRow.appendChild(movieHeader);

        // Movie Delete Button (X) SVG (close_24dp)
        const btnDeleteMovie = document.createElement('div');
        btnDeleteMovie.className = 'action-icon btn-delete';
        btnDeleteMovie.innerHTML = `
            <svg viewBox="0 -960 960 960" style="width:24px; height:24px;">
                <path d="M480-424 284-228q-11 11-28 11t-28-11q-11-11-11-28t11-28l196-196-196-196q-11-11-11-28t11-28q11-11 28-11t28 11l196 196 196-196q11-11 28-11t28 11q11 11 11 28t-11 28L536-480l196 196q11 11 11 28t-11 28q-11 11-28 11t-28-11L480-424Z"/>
            </svg>
        `;
        btnDeleteMovie.addEventListener('click', () => {
            moviesState.splice(movieIdx, 1);
            renderState();
        });
        movieHeaderRow.appendChild(btnDeleteMovie);
        movieGroup.appendChild(movieHeaderRow);

        // Schedule List Container
        const scheduleList = document.createElement('div');
        scheduleList.className = 'schedule-list';

        if (movie.date_time && movie.date_time.length > 0) {
            movie.date_time.forEach((schedule, scheduleIdx) => {
                const row = document.createElement('div');
                row.className = 'schedule-row';
                row.dataset.scheduleIdx = scheduleIdx;

                // --- Date Box ---
                const dateBox = document.createElement('div');
                dateBox.className = 'select-box date-box';
                
                const dateDisplay = schedule.date ? schedule.date : 'Anydate';
                const dateClass = schedule.date ? '' : 'class="placeholder"';
                
                // Calendar Icon SVG (calendar_month_24dp)
                dateBox.innerHTML = `
                    <svg class="icon" viewBox="0 -960 960 960">
                        <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-40q0-17 11.5-28.5T280-880q17 0 28.5 11.5T320-840v40h320v-40q0-17 11.5-28.5T680-880q17 0 28.5 11.5T720-840v40h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Zm0 0v-80 80Zm280 240q-17 0-28.5-11.5T440-440q0-17 11.5-28.5T480-480q17 0 28.5 11.5T520-440q0 17-11.5 28.5T480-400Zm-188.5-11.5Q280-423 280-440t11.5-28.5Q303-480 320-480t28.5 11.5Q360-457 360-440t-11.5 28.5Q337-400 320-400t-28.5-11.5ZM640-400q-17 0-28.5-11.5T600-440q0-17 11.5-28.5T640-480q17 0 28.5 11.5T680-440q0 17-11.5 28.5T640-400ZM480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-188.5-11.5Q280-263 280-280t11.5-28.5Q303-320 320-320t28.5 11.5Q360-297 360-280t-11.5 28.5Q337-240 320-240t-28.5-11.5ZM640-240q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240Z"/>
                    </svg>
                    <span ${dateClass}>${dateDisplay}</span>
                `;
                dateBox.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openCalendar(movieIdx, scheduleIdx, dateBox);
                });
                row.appendChild(dateBox);

                // --- Time Box (with native hidden select) ---
                const timeBox = document.createElement('div');
                timeBox.className = 'select-box time-box';
                
                const formatTime = (h) => `${h.toString().padStart(2, '0')}:00`;
                const currentTimeVal = schedule.time !== undefined ? parseInt(schedule.time) : 12;
                
                // Clock Icon SVG (schedule_24dp)
                timeBox.innerHTML = `
                    <svg class="icon" viewBox="0 -960 960 960">
                        <path d="M520-496v-144q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640v159q0 8 3 15.5t9 13.5l132 132q11 11 28 11t28-11q11-11 11-28t-11-28L520-496ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-400Zm0 320q133 0 226.5-93.5T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160Z"/>
                    </svg>
                    <span>${formatTime(currentTimeVal)}</span>
                `;
                
                const timeSelect = document.createElement('select');
                timeSelect.style.cssText = 'opacity: 0; position: absolute; top: 0; left: 0; width: 100%; height: 100%; cursor: pointer;';
                for (let h = 0; h <= 23; h++) {
                    const opt = document.createElement('option');
                    opt.value = h;
                    opt.textContent = formatTime(h);
                    if (h === currentTimeVal) opt.selected = true;
                    timeSelect.appendChild(opt);
                }
                timeSelect.addEventListener('change', (e) => {
                    schedule.time = parseInt(e.target.value);
                    renderState();
                });
                timeBox.appendChild(timeSelect);
                row.appendChild(timeBox);

                // --- People Box (with native hidden select) ---
                const peopleBox = document.createElement('div');
                peopleBox.className = 'select-box people-box';
                
                const currentPeopleVal = schedule.people !== undefined ? parseInt(schedule.people) : 1;
                
                // Group/People Icon SVG (group_24dp)
                peopleBox.innerHTML = `
                    <svg class="icon" viewBox="0 -960 960 960">
                        <path d="M40-272q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v32q0 33-23.5 56.5T600-160H120q-33 0-56.5-23.5T40-240v-32Zm800 112H738q11-18 16.5-38.5T760-240v-40q0-44-24.5-84.5T666-434q51 6 96 20.5t84 35.5q36 20 55 44.5t19 53.5v40q0 33-23.5 56.5T840-160ZM247-527q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47Zm466 0q-47 47-113 47-11 0-28-2.5t-28-5.5q27-32 41.5-71t14.5-81q0-42-14.5-81T544-792q14-5 28-6.5t28-1.5q66 0 113 47t47 113q0 66-47 113ZM120-240h480v-32q0-11-5.5-20T580-306q-54-27-109-40.5T360-360q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32Zm296.5-343.5Q440-607 440-640t-23.5-56.5Q393-720 360-720t-56.5 23.5Q280-673 280-640t23.5 56.5Q327-560 360-560t56.5-23.5ZM360-240Zm0-400Z"/>
                    </svg>
                    <span>${currentPeopleVal}</span>
                `;
                
                const peopleSelect = document.createElement('select');
                peopleSelect.style.cssText = 'opacity: 0; position: absolute; top: 0; left: 0; width: 100%; height: 100%; cursor: pointer;';
                for (let p = 1; p <= 8; p++) {
                    const opt = document.createElement('option');
                    opt.value = p;
                    opt.textContent = p;
                    if (p === currentPeopleVal) opt.selected = true;
                    peopleSelect.appendChild(opt);
                }
                peopleSelect.addEventListener('change', (e) => {
                    schedule.people = parseInt(e.target.value);
                    renderState();
                });
                peopleBox.appendChild(peopleSelect);
                row.appendChild(peopleBox);

                // --- Delete Button (X) SVG (close_24dp) ---
                const btnDelete = document.createElement('div');
                btnDelete.className = 'action-icon btn-delete';
                btnDelete.innerHTML = `
                    <svg viewBox="0 -960 960 960" style="width:24px; height:24px;">
                        <path d="M480-424 284-228q-11 11-28 11t-28-11q-11-11-11-28t11-28l196-196-196-196q-11-11-11-28t11-28q11-11 28-11t28 11l196 196 196-196q11-11 28-11t28 11q11 11 11 28t-11 28L536-480l196 196q11 11 11 28t-11 28q-11 11-28 11t-28-11L480-424Z"/>
                    </svg>
                `;
                btnDelete.addEventListener('click', () => {
                    movie.date_time.splice(scheduleIdx, 1);
                    renderState();
                });
                row.appendChild(btnDelete);

                // --- Drag Handle (=) SVG (drag_handle_24dp) ---
                const btnDrag = document.createElement('div');
                btnDrag.className = 'action-icon btn-drag';
                btnDrag.innerHTML = `
                    <svg viewBox="0 -960 960 960" style="width:24px; height:24px;">
                        <path d="M200-360q-17 0-28.5-11.5T160-400q0-17 11.5-28.5T200-440h560q17 0 28.5 11.5T800-400q0 17-11.5 28.5T760-360H200Zm0-160q-17 0-28.5-11.5T160-560q0-17 11.5-28.5T200-600h560q17 0 28.5 11.5T800-560q0 17-11.5 28.5T760-520H200Z"/>
                    </svg>
                `;

                // Drag & Drop Pointer Event Handlers (Works on mobile touch and desktop mouse)
                btnDrag.addEventListener('pointerdown', (e) => {
                    if (e.button !== 0 && e.pointerType === 'mouse') return;
                    
                    row.classList.add('dragging');
                    row.style.opacity = '0.5';
                    btnDrag.setPointerCapture(e.pointerId);
                    
                    const activeDragMovieIdx = movieIdx;
                    
                    const onPointerMove = (moveEv) => {
                        const y = moveEv.clientY;
                        const parent = row.parentNode;
                        
                        // Get all sibling rows in the same movie group (excluding the one being dragged)
                        const siblings = Array.from(parent.querySelectorAll('.schedule-row:not(.dragging)'));
                        
                        // Find the sibling whose midpoint is below the pointer Y coordinate
                        const nextSibling = siblings.find(sibling => {
                            const rect = sibling.getBoundingClientRect();
                            return y < rect.top + rect.height / 2;
                        });
                        
                        // Reorder in DOM
                        if (nextSibling) {
                            parent.insertBefore(row, nextSibling);
                        } else {
                            parent.appendChild(row);
                        }
                    };
                    
                    const onPointerUp = (upEv) => {
                        btnDrag.releasePointerCapture(upEv.pointerId);
                        btnDrag.removeEventListener('pointermove', onPointerMove);
                        btnDrag.removeEventListener('pointerup', onPointerUp);
                        btnDrag.removeEventListener('pointercancel', onPointerUp);
                        
                        row.classList.remove('dragging');
                        row.style.opacity = '';
                        
                        // Update moviesState with the new DOM child order
                        const parent = row.parentNode;
                        const rows = Array.from(parent.querySelectorAll('.schedule-row'));
                        const newSchedules = rows.map(r => {
                            const idx = parseInt(r.dataset.scheduleIdx);
                            return moviesState[activeDragMovieIdx].date_time[idx];
                        });
                        moviesState[activeDragMovieIdx].date_time = newSchedules;
                        
                        renderState();
                    };
                    
                    btnDrag.addEventListener('pointermove', onPointerMove);
                    btnDrag.addEventListener('pointerup', onPointerUp);
                    btnDrag.addEventListener('pointercancel', onPointerUp);
                });
                row.appendChild(btnDrag);

                scheduleList.appendChild(row);
            });
        }

        movieGroup.appendChild(scheduleList);

        // Add Schedule Row button (add_circle_24dp)
        const addScheduleBtn = document.createElement('button');
        addScheduleBtn.type = 'button';
        addScheduleBtn.className = 'btn-add-schedule';
        addScheduleBtn.innerHTML = `
            <svg viewBox="0 -960 960 960" style="width:24px; height:24px; fill: currentColor;">
                <path d="M440-440v120q0 17 11.5 28.5T480-280q17 0 28.5-11.5T520-320v-120h120q17 0 28.5-11.5T680-480q0-17-11.5-28.5T640-520H520v-120q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640v120H320q-17 0-28.5 11.5T280-480q0 17 11.5 28.5T320-440h120Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/>
            </svg>
            <span>Add schedule</span>
        `;
        addScheduleBtn.addEventListener('click', () => {
            if (!movie.date_time) {
                movie.date_time = [];
            }
            movie.date_time.push({
                start: false,
                date: "",
                time: 12,
                people: 1,
                link: ""
            });
            renderState();
        });
        movieGroup.appendChild(addScheduleBtn);

        moviesContainer.appendChild(movieGroup);
    });
}

// 3. Calendar rendering & handling logic
const calendarPopup = document.getElementById('calendar-popup');
const calendarMonthYear = document.getElementById('calendar-month-year');
const calendarGrid = document.getElementById('calendar-grid');

function openCalendar(movieIdx, scheduleIdx, targetElement) {
    if (calendarPopup.style.display === 'block' && activeMovieIdx === movieIdx && activeScheduleIdx === scheduleIdx) {
        calendarPopup.style.display = 'none';
        activeMovieIdx = null;
        activeScheduleIdx = null;
        return;
    }
    activeMovieIdx = movieIdx;
    activeScheduleIdx = scheduleIdx;
    
    const schedule = moviesState[movieIdx].date_time[scheduleIdx];
    if (schedule.date) {
        currentCalendarDate = new Date(schedule.date);
    } else {
        currentCalendarDate = new Date();
    }

    // Position relative to targetElement inside container
    const container = document.querySelector('.container');
    const containerRect = container.getBoundingClientRect();
    const triggerRect = targetElement.getBoundingClientRect();

    calendarPopup.style.left = `${triggerRect.left - containerRect.left}px`;
    calendarPopup.style.top = `${triggerRect.top - containerRect.top + triggerRect.height + 4}px`;
    calendarPopup.style.display = 'block';

    renderCalendar();
}

function renderCalendar() {
    calendarGrid.innerHTML = '';
    
    // Render Headers (Su, Mo, Tu...)
    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });

    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();

    calendarMonthYear.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Render Empty cells
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-day empty';
        calendarGrid.appendChild(empty);
    }

    const activeSchedule = moviesState[activeMovieIdx].date_time[activeScheduleIdx];
    let activeDateObj = null;
    if (activeSchedule.date) {
        activeDateObj = new Date(activeSchedule.date);
    }

    // Render Days
    for (let day = 1; day <= totalDays; day++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'calendar-day';
        dayCell.textContent = day;

        if (activeDateObj &&
            activeDateObj.getFullYear() === year &&
            activeDateObj.getMonth() === month &&
            activeDateObj.getDate() === day) {
            dayCell.classList.add('selected');
        }

        dayCell.addEventListener('click', () => {
            const selected = new Date(year, month, day);
            const formatted = formatValueDate(selected);
            
            moviesState[activeMovieIdx].date_time[activeScheduleIdx].date = formatted;
            calendarPopup.style.display = 'none';
            renderState();
        });

        calendarGrid.appendChild(dayCell);
    }
}

function formatValueDate(d) {
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
}

// Calendar Popup Actions
document.getElementById('prev-month-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    renderCalendar();
});

document.getElementById('next-month-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    renderCalendar();
});

document.getElementById('calendar-reset-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    if (activeMovieIdx !== null && activeScheduleIdx !== null) {
        moviesState[activeMovieIdx].date_time[activeScheduleIdx].date = "";
    }
    calendarPopup.style.display = 'none';
    activeMovieIdx = null;
    activeScheduleIdx = null;
    renderState();
});

// Hide calendar on outside clicks
document.addEventListener('click', (e) => {
    if (!calendarPopup.contains(e.target)) {
        calendarPopup.style.display = 'none';
        activeMovieIdx = null;
        activeScheduleIdx = null;
    }
});

// 4. Global Action Handlers
document.getElementById('btn-add-movie-action').addEventListener('click', () => {
    moviesState.push({
        title: '',
        date_time: []
    });
    renderState();
    
    // Focus on the newly added movie title input
    setTimeout(() => {
        const inputs = document.querySelectorAll('.movie-title-input');
        if (inputs.length > 0) {
            inputs[inputs.length - 1].focus();
        }
    }, 50);
});

document.getElementById('btn-save-action').addEventListener('click', () => {
    // Remove movies that have no title and no schedules to clean up
    const cleanedMovies = moviesState.filter(movie => {
        return movie.title.trim() !== '' || (movie.date_time && movie.date_time.length > 0);
    });

    // Ensure titles are trimmed
    cleanedMovies.forEach(movie => {
        movie.title = movie.title.trim();
    });

    const payload = {
        movies: cleanedMovies
    };

    // Send back to Telegram bot and close Web App
    tg.sendData(JSON.stringify(payload));
    tg.close();
});

// Initial rendering
if (moviesState.length === 0) {
    // Start with at least one empty movie group if no data is passed
    moviesState.push({
        title: '',
        date_time: []
    });
}
renderState();
