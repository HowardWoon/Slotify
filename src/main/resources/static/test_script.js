
        const state = {
            systemLog: [],
            mapData: null,
            recordsMode: 'all',
            sidebarCollapsed: false,
            lastQueueSize: 0,
            lastAvailableSlots: 0,
            lastActivityCount: 0,
            latestRecords: [],
            activeSearchPlate: '',
            routeAnimationToken: 0,
            activeNodeTooltip: null,
            mostRecentAssignedSlotId: null,
            activeHighlightedSlotId: null,
            activeRoutePath: null,
            undoStack: [],
            stackCollapsed: false,
            heapCollapsed: false,
            treeViewActive: false,
            sysArchCollapsed: false,
            slotsData: []
        };

        const svgNS = 'http://www.w3.org/2000/svg';

        /* SYSTEM ARCHITECTURE TABLES COLLAPSE LOGIC */
        function toggleSysArch() {
            const content = document.getElementById('sys-arch-content');
            const icon = document.getElementById('sys-arch-toggle-icon');
            state.sysArchCollapsed = !state.sysArchCollapsed;
            if (state.sysArchCollapsed) {
                content.style.maxHeight = content.scrollHeight + 'px';
                content.style.overflow = 'hidden';
                content.offsetHeight; // force reflow
                setTimeout(() => {
                    content.style.maxHeight = '0px';
                }, 10);
                icon.textContent = '[+]';
            } else {
                content.style.maxHeight = content.scrollHeight + 'px';
                icon.textContent = '[−]';
                setTimeout(() => {
                    if (!state.sysArchCollapsed) {
                        content.style.maxHeight = 'none';
                        content.style.overflow = 'visible';
                    }
                }, 300);
            }
        }

        /* LIFO STACK UNDO ACTIONS PANEL RENDERING */
        function toggleStackVisualizer() {
            const content = document.getElementById('stack-content');
            const icon = document.getElementById('stack-toggle-icon');
            state.stackCollapsed = !state.stackCollapsed;
            if (state.stackCollapsed) {
                content.style.maxHeight = content.scrollHeight + 'px';
                content.style.overflow = 'hidden';
                content.offsetHeight; // force reflow
                setTimeout(() => {
                    content.style.maxHeight = '0px';
                }, 10);
                icon.textContent = '[+]';
            } else {
                content.style.maxHeight = content.scrollHeight + 'px';
                icon.textContent = '[−]';
                setTimeout(() => {
                    if (!state.stackCollapsed) {
                        content.style.maxHeight = 'none';
                        content.style.overflow = 'visible';
                    }
                }, 300);
            }
        }

        function renderUndoStack(flashNodeId = null, flashAction = 'push') {
            const list = document.getElementById('stack-list');
            if (!list) return;
            if (!state.undoStack || state.undoStack.length === 0) {
                list.innerHTML = `<div class="empty-state" style="font-size: 0.85rem; text-align: center; color: var(--muted-2); margin-top: 10px;">Stack is currently empty. (LIFO operations appear here)</div>`;
                return;
            }
            list.innerHTML = '';
            
            // Render last 3 stack logs, newest on top
            const displayItems = [...state.undoStack].slice(-3).reverse();
            displayItems.forEach((action) => {
                const node = document.createElement('div');
                const isFlash = action.id === flashNodeId;
                node.className = `stack-node ${isFlash ? 'action-' + flashAction : ''}`;
                node.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: bold; color: ${action.type === 'PUSH' ? 'var(--emerald)' : 'var(--danger)'};">${action.type}</span>
                        <span style="color: var(--text); font-family: monospace; font-size:0.95rem;">${action.plate}</span>
                    </div>
                    <span style="font-size: 0.75rem; color: var(--muted-2);">${action.time}</span>
                `;
                list.appendChild(node);
            });
        }

        function pushToUndoStack(plate) {
            if (!state.undoStack) state.undoStack = [];
            const actionId = Date.now();
            const timeStr = formatTime(new Date());
            state.undoStack.push({
                id: actionId,
                type: 'PUSH',
                plate: plate,
                time: timeStr
            });
            renderUndoStack(actionId, 'push');
        }

        function popFromUndoStack() {
            if (!state.undoStack || state.undoStack.length === 0) return null;
            const popped = state.undoStack.pop();
            const actionId = Date.now();
            
            state.undoStack.push({
                id: actionId,
                type: 'POP',
                plate: popped.plate,
                time: formatTime(new Date())
            });
            renderUndoStack(actionId, 'pop');
            
            setTimeout(() => {
                const idx = state.undoStack.findIndex(x => x.id === actionId);
                if (idx !== -1) state.undoStack.splice(idx, 1);
                renderUndoStack();
            }, 750);
            
            return popped;
        }

        /* MIN-HEAP PRIORITY QUEUE BINARY TREE RENDERING */
        function toggleHeapVisualizer() {
            const content = document.getElementById('heap-content');
            const icon = document.getElementById('heap-toggle-icon');
            state.heapCollapsed = !state.heapCollapsed;
            if (state.heapCollapsed) {
                content.style.maxHeight = content.scrollHeight + 'px';
                content.style.overflow = 'hidden';
                content.offsetHeight; // force reflow
                setTimeout(() => {
                    content.style.maxHeight = '0px';
                }, 10);
                icon.textContent = '[+]';
            } else {
                content.style.maxHeight = content.scrollHeight + 'px';
                icon.textContent = '[−]';
                setTimeout(() => {
                    if (!state.heapCollapsed) {
                        content.style.maxHeight = 'none';
                        content.style.overflow = 'visible';
                    }
                }, 300);
            }
        }

        async function renderMinHeapTree(extractingSlotId = null) {
            const shell = document.getElementById('heap-svg-shell');
            if (!shell) return;
            try {
                const res = await fetch('/api/slots');
                if (!res.ok) return;
                const slots = await res.json();
                
                // Active unoccupied slots sorted by proximity (mimicking nearest slot Heap behavior)
                const available = slots.filter(s => !s.isOccupied).sort((a, b) => a.distance - b.distance);
                
                if (available.length === 0) {
                    shell.innerHTML = `<div class="empty-state" style="font-size: 0.85rem; color: var(--danger);">No active slots available. Heap is empty.</div>`;
                    return;
                }
                
                const width = shell.clientWidth || 360;
                const rootX = width / 2;
                
                // Coordinates mapping for triangle binary tree heap
                const pos = [
                    { x: rootX, y: 30 },
                    { x: rootX - 70, y: 90 },
                    { x: rootX + 70, y: 90 },
                    { x: rootX - 110, y: 142 },
                    { x: rootX - 35, y: 142 },
                    { x: rootX + 35, y: 142 },
                    { x: rootX + 110, y: 142 }
                ];
                
                let svgHTML = `<svg width="100%" height="160" style="overflow:visible;">`;
                
                // Connect lines
                for (let i = 0; i < available.length; i++) {
                    const parentIdx = Math.floor((i - 1) / 2);
                    if (parentIdx >= 0 && parentIdx < pos.length && i < pos.length) {
                        svgHTML += `<line x1="${pos[parentIdx].x}" y1="${pos[parentIdx].y}" x2="${pos[i].x}" y2="${pos[i].y}" stroke="rgba(69,240,166,0.3)" stroke-width="2" />`;
                    }
                }
                
                // Render tree node circles
                for (let i = 0; i < available.length && i < pos.length; i++) {
                    const slot = available[i];
                    const point = pos[i];
                    const isRoot = i === 0;
                    const isExtracting = slot.slotId === extractingSlotId;
                    
                    let fill = 'rgba(10, 18, 39, 0.9)';
                    let border = isRoot ? 'var(--amber)' : 'var(--emerald)';
                    let size = isRoot ? 19 : 15;
                    
                    if (isExtracting) {
                        fill = 'rgba(255, 107, 122, 0.25)';
                        border = 'var(--danger)';
                    }
                    
                    svgHTML += `
                        <g>
                            <circle cx="${point.x}" cy="${point.y}" r="${size}" fill="${fill}" stroke="${border}" stroke-width="${isRoot ? '3' : '2'}" style="transition: all 0.3s ease;" />
                            <text x="${point.x}" y="${point.y + 1}" text-anchor="middle" dominant-baseline="middle" font-size="${isRoot ? '12px' : '10px'}" fill="#ffffff" font-weight="bold">${slot.slotId}</text>
                            <text x="${point.x}" y="${point.y + (isRoot ? 30 : 25)}" text-anchor="middle" font-size="8px" fill="var(--muted-2)">${isRoot ? 'MIN ROOT' : 'HEAP ' + i}</text>
                        </g>
                    `;
                }
                
                svgHTML += `</svg>`;
                shell.innerHTML = svgHTML;
            } catch (err) {
                console.error('renderMinHeapTree', err);
            }
        }

        /* AVL Balanced Tree Search visualizer */
        function toggleTreeVisualizer() {
            const container = document.getElementById('avl-tree-container');
            const button = document.getElementById('btn-tree-toggle');
            state.treeViewActive = !state.treeViewActive;
            if (state.treeViewActive) {
                container.style.display = 'block';
                button.className = 'primary magnetic';
                renderAVLTree();
            } else {
                container.style.display = 'none';
                button.className = 'secondary magnetic';
            }
        }

        function renderAVLTree(searchPlate = '') {
            const shell = document.getElementById('avl-svg-shell');
            if (!shell) return;
            
            const records = [...state.latestRecords];
            if (records.length === 0) {
                shell.innerHTML = `<div class="empty-state" style="font-size: 0.85rem; color: var(--muted-2);">Display All records to load the AVL Tree visualization.</div>`;
                return;
            }
            
            // Sort records alphabetically for binary BST structure
            records.sort((a, b) => String(a.plateNumber).localeCompare(b.plateNumber));
            
            let treeNodes = [];
            if (records.length === 1) {
                treeNodes = [records[0]];
            } else if (records.length === 2) {
                treeNodes = [records[1], records[0]];
            } else if (records.length === 3) {
                treeNodes = [records[1], records[0], records[2]];
            } else if (records.length === 4) {
                treeNodes = [records[2], records[1], records[3], records[0]];
            } else {
                // sample 5 evenly balanced items
                treeNodes = [
                    records[Math.floor(records.length / 2)],             // Root (0)
                    records[Math.floor(records.length / 4)],             // Left (1)
                    records[Math.floor(records.length * 3 / 4)],         // Right (2)
                    records[0],                                         // Left-Left (3)
                    records[records.length - 1]                         // Right-Right (4)
                ];
            }
            
            const width = shell.clientWidth || 400;
            const rootX = width / 2;
            
            const pos = [
                { x: rootX, y: 32 },       // Root (0)
                { x: rootX - 90, y: 92 },  // Left (1)
                { x: rootX + 90, y: 92 },  // Right (2)
                { x: rootX - 145, y: 155 }, // Left-Left (3)
                { x: rootX + 145, y: 155 }  // Right-Right (4)
            ];
            
            const connections = [
                { parent: 0, child: 1 },
                { parent: 0, child: 2 },
                { parent: 1, child: 3 },
                { parent: 2, child: 4 }
            ];
            
            let svgHTML = `<svg width="100%" height="220" style="overflow:visible;">`;
            
            // Render connections
            connections.forEach(conn => {
                if (conn.parent < treeNodes.length && conn.child < treeNodes.length) {
                    svgHTML += `<line id="avl-edge-${conn.parent}-${conn.child}" x1="${pos[conn.parent].x}" y1="${pos[conn.parent].y}" x2="${pos[conn.child].x}" y2="${pos[conn.child].y}" stroke="rgba(109,247,255,0.22)" stroke-width="2" />`;
                }
            });
            
            // Search Path mapping
            let searchPath = [];
            if (searchPlate && treeNodes.length > 0) {
                const target = searchPlate.trim().toUpperCase();
                let currentIdx = 0;
                searchPath.push(0);
                
                while (currentIdx < treeNodes.length) {
                    const currentPlate = String(treeNodes[currentIdx].plateNumber).toUpperCase();
                    if (target === currentPlate) {
                        break;
                    } else if (target < currentPlate) {
                        const nextIdx = currentIdx === 0 ? 1 : currentIdx === 1 ? 3 : -1;
                        if (nextIdx !== -1 && nextIdx < treeNodes.length) {
                            currentIdx = nextIdx;
                            searchPath.push(currentIdx);
                        } else {
                            break;
                        }
                    } else {
                        const nextIdx = currentIdx === 0 ? 2 : currentIdx === 2 ? 4 : -1;
                        if (nextIdx !== -1 && nextIdx < treeNodes.length) {
                            currentIdx = nextIdx;
                            searchPath.push(currentIdx);
                        } else {
                            break;
                        }
                    }
                }
            }
            
            // Draw nodes
            treeNodes.forEach((node, idx) => {
                const point = pos[idx];
                const isTarget = node.plateNumber === searchPlate;
                const inPath = searchPath.includes(idx);
                
                let fill = 'rgba(10, 18, 39, 0.9)';
                let stroke = inPath ? 'var(--cyan)' : 'rgba(148, 163, 184, 0.28)';
                let strokeWidth = inPath ? '3' : '2';
                
                if (isTarget) {
                    fill = 'rgba(69, 240, 166, 0.15)';
                    stroke = 'var(--emerald)';
                    strokeWidth = '4';
                }
                
                svgHTML += `
                    <g id="avl-node-${idx}" style="transition: all 0.3s ease;">
                        <circle cx="${point.x}" cy="${point.y}" r="22" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" style="transition: all 0.3s ease;" />
                        <text x="${point.x}" y="${point.y + 1}" text-anchor="middle" dominant-baseline="middle" font-size="10px" font-weight="bold" fill="#ffffff" font-family="monospace">${node.plateNumber}</text>
                        <text x="${point.x}" y="${point.y + 36}" text-anchor="middle" font-size="8px" fill="var(--muted-2)">${node.ownerName}</text>
                    </g>
                `;
            });
            
            svgHTML += `</svg>`;
            shell.innerHTML = svgHTML;
            
            // Traversal sequence rendering
            if (searchPath.length > 1) {
                searchPath.forEach((nodeIdx, stepIdx) => {
                    setTimeout(() => {
                        const nodeGroup = document.getElementById(`avl-node-${nodeIdx}`);
                        if (nodeGroup) {
                            const circle = nodeGroup.querySelector('circle');
                            circle.setAttribute('fill', 'rgba(87, 199, 255, 0.25)');
                            circle.setAttribute('stroke', 'var(--cyan)');
                            circle.style.filter = 'drop-shadow(0 0 8px var(--cyan))';
                            
                            if (stepIdx > 0) {
                                const parentIdx = searchPath[stepIdx - 1];
                                const line = document.getElementById(`avl-edge-${parentIdx}-${nodeIdx}`) || document.getElementById(`avl-edge-${nodeIdx}-${parentIdx}`);
                                if (line) {
                                    line.setAttribute('stroke', 'var(--cyan)');
                                    line.setAttribute('stroke-width', '4');
                                }
                            }
                        }
                        
                        if (stepIdx === searchPath.length - 1) {
                            const isMatch = treeNodes[nodeIdx].plateNumber === searchPlate;
                            setTimeout(() => {
                                const finalGroup = document.getElementById(`avl-node-${nodeIdx}`);
                                if (finalGroup) {
                                    const finalCircle = finalGroup.querySelector('circle');
                                    finalCircle.setAttribute('fill', isMatch ? 'rgba(69, 240, 166, 0.22)' : 'rgba(255, 107, 122, 0.22)');
                                    finalCircle.setAttribute('stroke', isMatch ? 'var(--emerald)' : 'var(--danger)');
                                    finalCircle.style.filter = isMatch ? 'drop-shadow(0 0 12px var(--emerald))' : 'drop-shadow(0 0 12px var(--danger))';
                                }
                            }, 300);
                        }
                    }, stepIdx * 250);
                });
            }
        }

        function formatTime(date) {
            return [date.getHours(), date.getMinutes(), date.getSeconds()]
                .map(part => String(part).padStart(2, '0'))
                .join(':');
        }

        function formatStamp(date) {
            return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${formatTime(date)}`;
        }

        function animateCounter(element, nextValue, duration = 480) {
            const startValue = Number(element.dataset.value ?? element.textContent ?? 0);
            const delta = nextValue - startValue;
            const start = performance.now();

            function tick(now) {
                const progress = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                element.textContent = Math.round(startValue + delta * eased);
                if (progress < 1) requestAnimationFrame(tick);
                else element.dataset.value = String(nextValue);
            }

            requestAnimationFrame(tick);
        }

        function setText(id, value) {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        }

        function showToast(message, type = 'info') {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `
                <strong>${type === 'success' ? 'Success' : type === 'error' ? 'Attention' : 'System'}</strong>
                <span>${message}</span>
            `;
            container.appendChild(toast);
            setTimeout(() => {
                toast.style.animation = 'toastOut 0.28s ease forwards';
                setTimeout(() => toast.remove(), 260);
            }, 3400);
        }

        function toggleSystemLog() {
            document.getElementById('system-log').classList.toggle('collapsed');
        }

        function clearSystemLog() {
            if (confirm('Clear all log entries?')) {
                state.systemLog = [];
                document.getElementById('log-entries').innerHTML = '';
                addLogEntry('SYSTEM', 'Log cleared');
            }
        }

        function switchTab(tabId, button) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            const target = document.getElementById(`view-${tabId}`);
            if (target) {
                target.classList.add('active');
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            if (button) {
                button.classList.add('active');
                const label = button.querySelector('.nav-label');
                if (label) document.getElementById('breadcrumb-title').textContent = label.textContent;
            }
            if (tabId === 'database') {
                loadDatabasePanels();
            }
            if (tabId === 'overview' || tabId === 'gate') {
                refreshSlots();
            }
        }

        function addLogEntry(tag, message) {
            const entry = { time: new Date(), tag, message };
            state.systemLog.unshift(entry);
            if (state.systemLog.length > 40) state.systemLog.length = 40;
            renderLogEntry(entry);
            state.lastActivityCount = state.systemLog.length;
            setText('stat-activity', state.lastActivityCount);
            setText('overview-activity-count', state.lastActivityCount);
            setText('activity-feed', '');
            renderActivityFeed();
            updateLiveTicker();
        }

        function updateLiveTicker() {
            const ticker = document.getElementById('nav-stream-ticker');
            if (!ticker) return;
            if (state.systemLog.length === 0) {
                ticker.innerHTML = '<span class="ticker-entry">Awaiting telemetry logs...</span>';
                return;
            }
            const latest = state.systemLog.slice(0, 3);
            ticker.innerHTML = latest.map(e => {
                const timeStr = formatTime(e.time);
                return `<span class="ticker-entry">[${timeStr}] ${e.tag}: ${e.message}</span>`;
            }).join('');
        }

        function renderLogEntry(entry) {
            const logContent = document.getElementById('log-entries');
            const entryDiv = document.createElement('div');
            entryDiv.className = 'log-entry';
            entryDiv.innerHTML = `
                <span class="log-time">${formatTime(entry.time)}</span>
                <span class="log-tag ${entry.tag.toLowerCase()}">${entry.tag}</span>
                <span class="log-message">${entry.message}</span>
            `;
            logContent.insertBefore(entryDiv, logContent.firstChild);
            while (logContent.children.length > 18) {
                logContent.removeChild(logContent.lastChild);
            }
        }

        function renderActivityFeed() {
            const feeds = [document.getElementById('overview-feed'), document.getElementById('activity-feed')].filter(Boolean);
            if (!feeds.length) return;
            const items = state.systemLog.slice(0, 4);
            if (items.length === 0) {
                feeds.forEach(feed => {
                    feed.innerHTML = '<div class="empty-state">No recent activity yet.</div>';
                });
                return;
            }
            feeds.forEach(feed => {
                feed.innerHTML = '';
                items.forEach((entry, index) => {
                    const block = document.createElement('div');
                    block.className = 'assistant-stat';
                    block.style.animationDelay = `${index * 70}ms`;
                    block.innerHTML = `
                        <div>
                            <strong style="color: ${entry.tag === 'UNDO' ? 'var(--danger)' : entry.tag === 'PROCESS' ? 'var(--cyan)' : entry.tag === 'ARRIVAL' ? 'var(--amber)' : 'inherit'}">${entry.tag}</strong>
                            <span class="muted">${entry.message}</span>
                        </div>
                        <span class="chip">${formatTime(entry.time)}</span>
                    `;
                    feed.appendChild(block);
                });
            });
        }

        function renderMiniChart(queueSize, availableSlots, activityCount) {
            const chart = document.getElementById('mini-chart');
            if (!chart) return;
            const values = [
                Math.max(2, Math.min(18, queueSize + 3)),
                Math.max(2, Math.min(18, availableSlots + 2)),
                Math.max(2, Math.min(18, activityCount + 4)),
                Math.max(2, Math.min(18, queueSize + 6)),
                Math.max(2, Math.min(18, availableSlots + 7)),
                Math.max(2, Math.min(18, activityCount + 5)),
                Math.max(2, Math.min(18, queueSize + availableSlots + 2))
            ];
            chart.innerHTML = values.map(v => `<span style="height:${v * 4}px"></span>`).join('');
        }

        function renderQueue(queueDetails = []) {
            const queueContainer = document.getElementById('queue-visual-container');
            queueContainer.innerHTML = '';
            if (!queueDetails.length) {
                queueContainer.innerHTML = `
                    <div class="flowchart-empty">
                        <div class="flow-box queue-box">
                            <span class="flow-icon">📋</span> Queue
                        </div>
                        <div class="flow-arrow">→</div>
                        <div class="flow-box heap-box">
                            <span class="flow-icon">▲</span> Min-Heap
                        </div>
                        <div class="flow-arrow">→</div>
                        <div class="flow-box assign-box">
                            <span class="flow-icon">🅿</span> Slot Assignment
                        </div>
                    </div>
                `;
                return;
            }
            queueDetails.forEach((vehicle, index) => {
                const item = document.createElement('div');
                item.className = 'queue-item';
                item.style.animationDelay = `${index * 55}ms`;
                item.innerHTML = `
                    <div class="queue-index">${index + 1}</div>
                    <div>
                        <strong>${vehicle.plateNumber}</strong>
                        <div class="list-meta">${vehicle.ownerName || 'Unknown owner'}</div>
                    </div>
                    <span class="queue-badge"><span class="slot-dot"></span> Waiting</span>
                `;
                queueContainer.appendChild(item);
            });
        }

        function renderHeatmap(slots = []) {
            const heatmap = document.getElementById('slot-heatmap');
            if (!heatmap) return;
            heatmap.innerHTML = '';
            if (!slots.length) {
                heatmap.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;">Slot data is unavailable.</div>';
                return;
            }
            slots.forEach((slot, index) => {
                const card = document.createElement('div');
                card.className = `slot-card ${slot.isOccupied ? 'occupied' : 'available'}`;
                card.style.animationDelay = `${index * 26}ms`;
                card.style.cursor = 'pointer';
                card.innerHTML = `
                    <span class="slot-dot" style="background:${slot.isOccupied ? 'var(--danger)' : 'var(--emerald)'}; box-shadow: 0 0 10px ${slot.isOccupied ? 'rgba(255,107,122,0.7)' : 'rgba(69,240,166,0.7)'}"></span>
                    <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 2px;">
                        <strong>${slot.slotId}</strong>
                        <span style="font-size: 0.72rem; font-weight: bold; color: ${slot.isOccupied ? 'var(--danger)' : 'var(--emerald)'}; text-transform: uppercase; letter-spacing: 0.02em;">${slot.isOccupied ? 'Busy' : 'Ready'}</span>
                    </div>
                `;
                card.addEventListener('click', async () => {
                    try {
                        state.activeHighlightedSlotId = slot.slotId;
                        const res = await fetch(`/api/route?start=0&end=${slot.slotId}`);
                        if (!res.ok) return;
                        const data = await res.json();
                        if (Array.isArray(data.path) && data.path.length > 0) {
                            displayRoutePathDetails(data.path, data.distance, false);
                            highlightRoute(data.path, true);
                        }
                    } catch (e) {
                        console.error('Error fetching route', e);
                    }
                });
                heatmap.appendChild(card);
            });
        }

        async function fetchStats() {
            try {
                const res = await fetch('/api/stats');
                if (!res.ok) return;
                const stats = await res.json();
                const queueSize = Number(stats.queueSize ?? 0);
                const availableSlots = Number(stats.availableSlots ?? 0);
                state.lastQueueSize = queueSize;

                const queueElement = document.getElementById('stat-queue');
                const availableElement = document.getElementById('stat-available');
                if (queueElement) animateCounter(queueElement, queueSize);
                if (availableElement) animateCounter(availableElement, availableSlots);
                setText('stat-queue-mini', queueSize);
                setText('stat-slots-mini', availableSlots);
                setText('assistant-queue-value', queueSize);
                setText('assistant-available-value', availableSlots);
                setText('insight-queue', queueSize);
                setText('insight-open', availableSlots);
                setText('insight-total', stats.totalRecorded !== undefined ? stats.totalRecorded : 0);
                setText('overview-queue-count', queueSize);
                setText('overview-slot-count', availableSlots);
                setText('overview-activity-count', state.lastActivityCount);
                setText('stat-status', 'Online');
                setText('system-mode', 'Online');

                const queueMessage = queueSize === 0 ? 'Queue pressure nominal' : queueSize < 4 ? 'Queue is flowing smoothly' : 'Queue build-up detected';
                const slotMessage = availableSlots > 3 ? 'Slot allocation stable' : 'Slots nearing capacity';
                setText('assistant-queue', queueMessage);
                setText('assistant-slot', slotMessage);

                renderQueue(Array.isArray(stats.queueDetails) ? stats.queueDetails : []);
                renderMiniChart(queueSize, availableSlots, state.lastActivityCount);
            } catch (error) {
                console.error('fetchStats', error);
            }
        }

        let simulationInterval = null;
        let isSimulating = false;
        function startDemoRoute() {
            const slotsToVisit = [101, 102, 103, 104, 105];
            let currentSlotIndex = 0;
            
            async function playSimulationStep() {
                const isOverviewActive = document.getElementById('view-overview').classList.contains('active');
                if (!isOverviewActive || state.activeHighlightedSlotId) {
                    return;
                }
                
                isSimulating = true;
                const targetSlot = slotsToVisit[currentSlotIndex];
                
                try {
                    // Update mini feed to show thinking process
                    const routingStatusEl = document.getElementById('intel-routing-status');
                    if (routingStatusEl) {
                        routingStatusEl.textContent = 'CALCULATING';
                        routingStatusEl.style.color = 'var(--amber)';
                    }
                    setText('intel-routing-desc', `Evaluating heuristic costs to Slot ${targetSlot}...`);
                    
                    const res = await fetch(`/api/route?start=0&end=${targetSlot}`);
                    if (!res.ok) return;
                    const data = await res.json();
                    
                    if (Array.isArray(data.path) && data.path.length > 0) {
                        highlightRoute(data.path, true, '#overview-map svg');
                        displayRoutePathDetails(data.path, data.distance, false);
                        
                        setTimeout(() => {
                            if (isSimulating && document.getElementById('view-overview').classList.contains('active') && !state.activeHighlightedSlotId) {
                                clearRouteHighlight('#overview-map svg', false);
                            }
                        }, 5000);
                    }
                } catch (e) {
                    console.error('Simulation error', e);
                }
                
                currentSlotIndex = (currentSlotIndex + 1) % slotsToVisit.length;
            }
            
            playSimulationStep();
            simulationInterval = setInterval(playSimulationStep, 6000);
        }

        async function loadMap() {
            try {
                const res = await fetch('/api/map');
                if (!res.ok) return;
                state.mapData = await res.json();
                renderMap(state.mapData);
                await refreshSlots();
            } catch (error) {
                console.error('loadMap', error);
            }
        }

        function showNodeTooltip(label, id, x, y) {
            const tooltip = document.getElementById('node-tooltip');
            let extraHTML = '';
            if (id >= 100) {
                const slotInfo = state.slotsData.find(s => s.slotId === id);
                if (slotInfo) {
                    const statusColor = slotInfo.isOccupied ? 'var(--danger)' : 'var(--emerald)';
                    const statusText = slotInfo.isOccupied ? 'Occupied' : 'Available';
                    extraHTML = `
                        <div style="margin-top: 6px; font-size: 0.8rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 6px;">
                            <span style="color: var(--cyan)">Distance:</span> ${slotInfo.distance} units<br>
                            <span style="color: ${statusColor}">Status:</span> ${statusText}
                        </div>
                    `;
                }
            }
            tooltip.innerHTML = `<strong>${label}</strong><div class="tooltip-subtext">Node ID ${id}</div>${extraHTML}`;
            tooltip.style.left = `${x + 14}px`;
            tooltip.style.top = `${y + 14}px`;
            tooltip.classList.add('visible');
        }

        function hideNodeTooltip() {
            const tooltip = document.getElementById('node-tooltip');
            tooltip.classList.remove('visible');
        }

        function renderMap(map) {
            const containers = ['overview-map', 'gate-map'].map(id => document.getElementById(id)).filter(Boolean);
            containers.forEach(container => {
                container.innerHTML = '<div class="map-overlay"></div>';

                const svg = document.createElementNS(svgNS, 'svg');
                svg.setAttribute('width', '100%');
                svg.setAttribute('height', '100%');
                svg.setAttribute('viewBox', '0 0 920 740');
                container.appendChild(svg);

                const defs = document.createElementNS(svgNS, 'defs');
                defs.innerHTML = `
                    <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" result="blur"></feGaussianBlur>
                        <feMerge>
                            <feMergeNode in="blur"></feMergeNode>
                            <feMergeNode in="SourceGraphic"></feMergeNode>
                        </feMerge>
                    </filter>
                    <linearGradient id="road-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
                        <stop offset="0%" stop-color="#57c7ff"></stop>
                        <stop offset="50%" stop-color="#9e8bff"></stop>
                        <stop offset="100%" stop-color="#45f0a6"></stop>
                    </linearGradient>
                `;
                svg.appendChild(defs);

                const nodes = map.nodes || [];
                const edges = map.edges || [];
                const pos = {};
                const aisleX = 460;
                const aisleStartY = 560;
                const aisleEndY = 90;
                const aisleNodeSpacing = (aisleStartY - aisleEndY) / 8;

                pos[0] = { x: aisleX, y: aisleStartY };
                for (let i = 1; i <= 8; i++) {
                    pos[i] = { x: aisleX, y: aisleStartY - (i * aisleNodeSpacing) };
                }

                const slotIds = [101, 102, 103, 104, 105];
                const slotsPerSide = Math.ceil(slotIds.length / 2);
                slotIds.forEach((slotId, index) => {
                    pos[slotId] = index < slotsPerSide
                        ? { x: aisleX - 330, y: aisleStartY - 180 - (index * 112) }
                        : { x: aisleX + 330, y: aisleStartY - 180 - ((index - slotsPerSide) * 112) };
                });

                edges.forEach(edge => {
                    const start = pos[edge.source];
                    const end = pos[edge.target];
                    if (!start || !end) return;

                    const cx_val = (start.x + end.x) / 2;
                    const cy_val = (start.y + end.y) / 2;
                    let cx = cx_val;
                    let cy = cy_val;
                    
                    const isVertical = Math.abs(start.y - end.y) > Math.abs(start.x - end.x);
                    if (isVertical) {
                        cx += 25; 
                    } else {
                        const direction = (start.x < end.x) ? 1 : -1;
                        cy -= 35 * direction;
                    }

                    const line = document.createElementNS(svgNS, 'path');
                    line.setAttribute('d', `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`);
                    line.setAttribute('stroke', '#334155');
                    line.setAttribute('fill', 'none');
                    line.setAttribute('stroke-width', '2');
                    line.setAttribute('stroke-linecap', 'round');
                    line.setAttribute('opacity', '0.5');
                    line.setAttribute('data-weight', edge.weight);
                    line.setAttribute('data-source', edge.source);
                    line.setAttribute('data-target', edge.target);
                    line.setAttribute('data-cx', cx);
                    line.setAttribute('data-cy', cy);
                    svg.appendChild(line);
                });

                nodes.forEach(node => {
                    const point = pos[node.id];
                    if (!point) return;

                    const group = document.createElementNS(svgNS, 'g');
                    group.setAttribute('transform', `translate(${point.x}, ${point.y})`);
                    group.setAttribute('data-node-id', node.id);
                    group.setAttribute('data-x', point.x);
                    group.setAttribute('data-y', point.y);

                    const isEntrance = node.id === 0;
                    const isSlot = node.id >= 100;
                    const radius = isEntrance ? 28 : isSlot ? 25 : 14;
                    
                    let fill, stroke, strokeWidth;
                    if (isEntrance) {
                        fill = 'rgba(87, 199, 255, 0.15)';
                        stroke = '#57c7ff';
                        strokeWidth = '4';
                    } else if (isSlot) {
                        fill = 'rgba(16, 185, 129, 0.12)';
                        stroke = '#45f0a6';
                        strokeWidth = '3';
                    } else {
                        fill = 'rgba(30, 41, 59, 0.9)';
                        stroke = '#64748b';
                        strokeWidth = '2';
                    }

                    const circle = document.createElementNS(svgNS, 'circle');
                    circle.setAttribute('r', radius);
                    circle.setAttribute('fill', fill);
                    circle.setAttribute('stroke', stroke);
                    circle.setAttribute('stroke-width', strokeWidth);
                    circle.setAttribute('id', `node-${node.id}`);
                    circle.style.transition = 'fill 0.22s ease, transform 0.22s ease, filter 0.22s ease';
                    group.appendChild(circle);
                    
                    if (isEntrance) {
                        const radar1 = document.createElementNS(svgNS, 'circle');
                        radar1.setAttribute('r', radius);
                        radar1.setAttribute('fill', 'none');
                        radar1.setAttribute('stroke', stroke);
                        radar1.setAttribute('stroke-width', '2');
                        radar1.style.animation = 'radarPulse 3s cubic-bezier(0.1, 0.7, 1, 0.1) infinite';
                        radar1.style.transformOrigin = 'center center';
                        group.appendChild(radar1);

                        const radar2 = document.createElementNS(svgNS, 'circle');
                        radar2.setAttribute('r', radius);
                        radar2.setAttribute('fill', 'none');
                        radar2.setAttribute('stroke', stroke);
                        radar2.setAttribute('stroke-width', '2');
                        radar2.style.animation = 'radarPulse 3s cubic-bezier(0.1, 0.7, 1, 0.1) 1.5s infinite';
                        radar2.style.transformOrigin = 'center center';
                        group.appendChild(radar2);
                    }

                    const halo = document.createElementNS(svgNS, 'circle');
                    halo.setAttribute('r', radius + 10);
                    halo.setAttribute('fill', 'rgba(255,255,255,0.03)');
                    halo.setAttribute('stroke', 'rgba(255,255,255,0.08)');
                    halo.setAttribute('stroke-width', '1');
                    group.appendChild(halo);

                    const label = document.createElementNS(svgNS, 'text');
                    label.setAttribute('class', 'map-node-label');
                    label.setAttribute('text-anchor', 'middle');
                    label.setAttribute('dominant-baseline', 'middle');
                    label.setAttribute('font-size', isSlot ? '14px' : '16px');
                    label.setAttribute('font-weight', '700');
                    label.setAttribute('fill', '#ffffff');
                    label.style.fill = '#ffffff';
                    label.style.stroke = 'none';
                    label.style.strokeWidth = '0';
                    label.style.paintOrder = 'fill';
                    label.style.filter = 'none';
                    label.style.textShadow = 'none';
                    
                    if (isSlot) {
                        label.setAttribute('x', 0);
                        label.setAttribute('y', 0);
                    } else {
                        const labelOffsetY = isEntrance ? radius + 20 : 6;
                        const labelOffsetX = isEntrance ? 0 : radius + 20;
                        if (!isEntrance) label.setAttribute('text-anchor', 'start');
                        label.setAttribute('x', labelOffsetX);
                        label.setAttribute('y', labelOffsetY);
                    }
                    label.textContent = isSlot ? node.id : node.label;
                    group.appendChild(label);

                    if (isSlot) {
                        group.style.cursor = 'pointer';
                        group.addEventListener('click', async () => {
                            try {
                                state.activeHighlightedSlotId = node.id;
                                const res = await fetch(`/api/route?start=0&end=${node.id}`);
                                if (!res.ok) return;
                                const data = await res.json();
                                if (Array.isArray(data.path) && data.path.length > 0) {
                                    displayRoutePathDetails(data.path, data.distance, false);
                                    highlightRoute(data.path, true);
                                }
                            } catch (e) {
                                console.error('Error fetching route', e);
                            }
                        });
                    }

                    group.addEventListener('mouseenter', event => {
                        showNodeTooltip(node.label, node.id, event.clientX, event.clientY);
                    });
                    group.addEventListener('mousemove', event => {
                        showNodeTooltip(node.label, node.id, event.clientX, event.clientY);
                    });
                    group.addEventListener('mouseleave', hideNodeTooltip);

                    svg.appendChild(group);
                });
            });
        }
        async function refreshSlots() {
            try {
                const res = await fetch('/api/slots');
                if (!res.ok) return;
                const slots = await res.json();
                state.slotsData = slots;

                renderHeatmap(slots);
                // Calculate centerpiece top telemetry stats
                const unoccupied = slots.filter(s => !s.isOccupied);
                const occupiedCount = slots.length - unoccupied.length;
                
                const occupancyEl = document.getElementById('telemetry-occupancy-load');
                if (occupancyEl) {
                    occupancyEl.textContent = `${occupiedCount} / ${slots.length} bays occupied`;
                }
                
                const heapRootEl = document.getElementById('telemetry-heap-root');
                if (heapRootEl) {
                    if (unoccupied.length > 0) {
                        const sortedUnoccupied = [...unoccupied].sort((a, b) => a.distance - b.distance);
                        heapRootEl.textContent = `Slot ${sortedUnoccupied[0].slotId} (${sortedUnoccupied[0].distance}u)`;
                    } else {
                        heapRootEl.textContent = 'FULL';
                    }
                }
                
                const avgDistEl = document.getElementById('telemetry-avg-distance');
                if (avgDistEl) {
                    if (unoccupied.length > 0) {
                        const sumDist = unoccupied.reduce((sum, s) => sum + s.distance, 0);
                        const avgDist = Math.round(sumDist / unoccupied.length);
                        avgDistEl.textContent = `${avgDist} units`;
                    } else {
                        avgDistEl.textContent = 'N/A';
                    }
                }

                document.querySelectorAll('.route-map svg').forEach(svg => {
                    slots.forEach(slot => {
                        const node = svg.querySelector(`#node-${slot.slotId}`);
                        if (node) {
                            const occupied = Boolean(slot.isOccupied);
                            const isMostRecent = slot.slotId === state.mostRecentAssignedSlotId;
                            
                            if (isMostRecent) {
                                node.setAttribute('fill', occupied ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)');
                                node.setAttribute('filter', 'url(#neon-glow)');
                                node.setAttribute('stroke', '#ffd36d'); // pulsing amber/yellow ring
                                node.setAttribute('stroke-width', '5');
                                node.style.animation = 'glowPulse 1.8s ease-in-out infinite';
                            } else {
                                node.setAttribute('fill', occupied ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)');
                                node.setAttribute('stroke', occupied ? '#ff6b7a' : '#45f0a6');
                                node.setAttribute('stroke-width', '3');
                                node.removeAttribute('filter');
                                node.style.animation = 'none';
                            }
                        }
                    });
                });
                if (state.activeHighlightedSlotId) {
                    refreshActiveRoute();
                }
            } catch (error) {
                console.error('refreshSlots', error);
            }
        }

        function animateRouteTraversal(svg, path) {
            // Create a premium vehicle emoji node
            const dot = document.createElementNS(svgNS, 'text');
            dot.setAttribute('font-size', '20px');
            dot.setAttribute('text-anchor', 'middle');
            dot.setAttribute('dominant-baseline', 'middle');
            dot.classList.add('route-trace-dot');
            dot.textContent = '🚗';
            
            // Start the dot coordinates at the first node immediately instead of defaulting to top-left (0,0)
            if (path && path.length > 0) {
                const startNode = svg.querySelector(`#node-${path[0]}`);
                if (startNode) {
                    const startGroup = startNode.closest('g');
                    if (startGroup) {
                        dot.setAttribute('x', startGroup.getAttribute('data-x'));
                        dot.setAttribute('y', Number(startGroup.getAttribute('data-y')) + 2); // tiny visual offset for emoji centering
                    }
                }
            }
            svg.appendChild(dot);

            const token = ++state.routeAnimationToken;
            path.forEach((nodeId, index) => {
                setTimeout(() => {
                    if (token !== state.routeAnimationToken) {
                        dot.remove();
                        return;
                    }
                    const node = svg.querySelector(`#node-${nodeId}`);
                    if (!node) return;
                    const group = node.closest('g');
                    if (!group) return;
                    const x = Number(group.getAttribute('data-x'));
                    const y = Number(group.getAttribute('data-y'));
                    dot.setAttribute('x', x);
                    dot.setAttribute('y', y + 2);

                    const trail = document.createElementNS(svgNS, 'circle');
                    trail.setAttribute('cx', x);
                    trail.setAttribute('cy', y);
                    trail.setAttribute('r', '4');
                    trail.setAttribute('fill', '#6df7ff');
                    trail.setAttribute('opacity', '0.5');
                    trail.classList.add('route-trace-trail');
                    svg.appendChild(trail);
                    setTimeout(() => trail.remove(), 850);

                    if (index === path.length - 1) {
                        setTimeout(() => dot.remove(), 450);
                    }
                }, index * 200);
            });
        }

        function highlightRoute(path, runAnimation = true, containerSelector = '.route-map svg') {
            const svgs = Array.from(document.querySelectorAll(containerSelector));
            if (!svgs.length || !Array.isArray(path) || !path.length) return;

            state.activeRoutePath = path;

            svgs.forEach(svg => {
                svg.querySelectorAll('path').forEach(line => {
                    line.setAttribute('stroke', '#334155');
                    line.setAttribute('stroke-width', '2');
                    line.setAttribute('opacity', '0.35');
                    line.removeAttribute('stroke-dasharray');
                    line.style.filter = 'none';
                    line.style.animation = 'none';
                });

                let totalWeight = 0;
                let midPoint = null;
                let pillG = null;

                for (let index = 0; index < path.length - 1; index++) {
                    const fromNode = path[index];
                    const toNode = path[index + 1];
                    const line = Array.from(svg.querySelectorAll('path')).find(element => {
                        const source = Number(element.getAttribute('data-source'));
                        const target = Number(element.getAttribute('data-target'));
                        return (source === fromNode && target === toNode) || (source === toNode && target === fromNode);
                    });
                    if (line) {
                        line.setAttribute('stroke', '#ffd36d');
                        line.setAttribute('stroke-width', '6');
                        line.setAttribute('opacity', '1');
                        line.setAttribute('stroke-dasharray', '8 6');
                        line.style.filter = 'drop-shadow(0 0 10px rgba(255,211,109,0.75))';
                        line.style.animation = 'dashMove 0.8s linear infinite';

                        totalWeight += Number(line.getAttribute('data-weight') || 0);
                        if (index === Math.floor((path.length - 1) / 2)) {
                            const sx = Number(svg.querySelector(`#node-${fromNode}`).closest('g').getAttribute('data-x'));
                            const sy = Number(svg.querySelector(`#node-${fromNode}`).closest('g').getAttribute('data-y'));
                            const ex = Number(svg.querySelector(`#node-${toNode}`).closest('g').getAttribute('data-x'));
                            const ey = Number(svg.querySelector(`#node-${toNode}`).closest('g').getAttribute('data-y'));
                            const cx = Number(line.getAttribute('data-cx'));
                            const cy = Number(line.getAttribute('data-cy'));
                            midPoint = {
                                x: 0.25 * sx + 0.5 * cx + 0.25 * ex,
                                y: 0.25 * sy + 0.5 * cy + 0.25 * ey
                            };
                        }
                    }
                }

                svg.querySelectorAll('.route-trace-dot, .route-trace-trail, .distance-pill').forEach(node => node.remove());

                if (midPoint && totalWeight > 0) {
                    pillG = document.createElementNS(svgNS, 'g');
                    pillG.classList.add('distance-pill');
                    pillG.setAttribute('transform', `translate(${midPoint.x}, ${midPoint.y})`);
                    
                    const rect = document.createElementNS(svgNS, 'rect');
                    rect.setAttribute('x', '-40');
                    rect.setAttribute('y', '-14');
                    rect.setAttribute('width', '80');
                    rect.setAttribute('height', '28');
                    rect.setAttribute('rx', '14');
                    rect.setAttribute('fill', 'rgba(10, 18, 39, 0.9)');
                    rect.setAttribute('stroke', '#ffd36d');
                    rect.setAttribute('stroke-width', '2');
                    
                    const text = document.createElementNS(svgNS, 'text');
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('dominant-baseline', 'middle');
                    text.setAttribute('font-size', '12px');
                    text.setAttribute('font-weight', 'bold');
                    text.setAttribute('fill', '#ffd36d');
                    text.textContent = `${totalWeight} units`;
                    
                    pillG.appendChild(rect);
                    pillG.appendChild(text);
                    svg.appendChild(pillG);
                }

                const destination = path[path.length - 1];
                const targetNode = svg.querySelector(`#node-${destination}`);
                if (destination && targetNode) {
                    targetNode.setAttribute('filter', 'url(#neon-glow)');
                    targetNode.setAttribute('stroke', '#ffd36d');
                    targetNode.setAttribute('stroke-width', '5');
                    svg.closest('.glass-card').classList.add('active-target');
                }

                if (runAnimation) {
                    animateRouteTraversal(svg, path);
                }
            });

            // Display explored step counter HUD (Task 5) - integrated into dynamic hover tooltip triggers
            const exploredSteps = path.length + 3;
            const hudHTML = `
                <span style="color: var(--amber)">★ Dijkstra Active Route</span><br>
                Explored Nodes: <strong style="color: var(--cyan)">${exploredSteps}</strong><br>
                Shortest Path: <strong style="color: var(--emerald)">${path.length} nodes</strong>
            `;
            document.querySelectorAll('.tooltip-hud-content').forEach(el => {
                el.innerHTML = hudHTML;
            });
        }

        async function refreshActiveRoute() {
            if (!state.activeHighlightedSlotId) return;
            try {
                const res = await fetch(`/api/route?start=0&end=${state.activeHighlightedSlotId}`);
                if (!res.ok) return;
                const data = await res.json();
                if (Array.isArray(data.path) && data.path.length > 0) {
                    state.activeRoutePath = data.path;
                    displayRoutePathDetails(data.path, data.distance, state.activeHighlightedSlotId === state.mostRecentAssignedSlotId);
                    highlightRoute(data.path, false);
                }
            } catch (e) {
                console.error('Error refreshing active route', e);
            }
        }

        function clearRouteHighlight(containerSelector = '.route-map svg', resetTelemetry = true) {
            if (resetTelemetry) {
                state.activeHighlightedSlotId = null;
                state.activeRoutePath = null;
                state.routeAnimationToken += 1;
                document.querySelectorAll('.tooltip-hud-content').forEach(el => {
                    el.innerHTML = 'Dijkstra engine idle. Process a vehicle to see path steps.';
                });

                // Reset centerpiece Route Intelligence telemetry
                setText('telemetry-active-terminal', 'STANDBY');
                const routingStatusEl = document.getElementById('intel-routing-status');
                if (routingStatusEl) {
                    routingStatusEl.textContent = 'SYSTEM IDLE';
                    routingStatusEl.style.color = 'var(--cyan)';
                }
                setText('intel-routing-desc', 'Select a slot circle or process a vehicle to calculate guidance.');
                setText('intel-target-terminal', '—');
                setText('intel-shortest-distance', '—');
                setText('intel-nav-eta', '—');
                setText('intel-explored-nodes', '—');
                
                const pillsContainer = document.getElementById('intel-path-pills');
                if (pillsContainer) {
                    pillsContainer.innerHTML = '<div class="empty-state" style="padding: 10px; font-size: 0.8rem; border: none; background: transparent; color: var(--muted-2);">Awaiting path data...</div>';
                }
                const heapRecContainer = document.getElementById('intel-heap-rec');
                if (heapRecContainer) {
                    heapRecContainer.innerHTML = 'Root element: <strong>None</strong>. Select slot to evaluate decision bounds.';
                }
            }
            document.querySelectorAll(containerSelector).forEach(svg => {
                svg.querySelectorAll('path').forEach(line => {
                    line.setAttribute('stroke', '#334155');
                    line.setAttribute('stroke-width', '2');
                    line.setAttribute('opacity', '0.35');
                    line.removeAttribute('stroke-dasharray');
                    line.style.filter = 'none';
                    line.style.animation = 'none';
                });
                svg.querySelectorAll('.route-trace-dot, .route-trace-trail, .distance-pill').forEach(node => node.remove());
                
                // Reset node circle strokes, stroke-widths, and card classes
                svg.querySelectorAll('circle').forEach(circle => {
                    const idAttr = circle.getAttribute('id');
                    if (idAttr && idAttr.startsWith('node-')) {
                        const idNum = parseInt(idAttr.replace('node-', ''), 10);
                        const isSlot = idNum >= 100;
                        const isEntrance = idNum === 0;
                        if (isEntrance) {
                            circle.setAttribute('stroke', '#57c7ff');
                            circle.setAttribute('stroke-width', '4');
                        } else if (isSlot) {
                            circle.setAttribute('stroke', '#45f0a6');
                            circle.setAttribute('stroke-width', '3');
                        } else {
                            circle.setAttribute('stroke', '#64748b');
                            circle.setAttribute('stroke-width', '2');
                        }
                        circle.removeAttribute('filter');
                        circle.style.animation = 'none';
                    }
                });
                const card = svg.closest('.glass-card');
                if (card) {
                    card.classList.remove('active-target');
                }
            });
            refreshSlots();
        }

        function displayRoutePathDetails(path, distance, isAssignment = false) {
            const resultDiv = document.getElementById('processResult');
            const slotSpan = document.getElementById('resultSlot');
            const pathDiv = document.getElementById('resultPath');
            if (!resultDiv || !slotSpan || !pathDiv) return;

            const destination = path[path.length - 1];
            if (isAssignment) {
                slotSpan.innerHTML = `Assigned Slot: <span style="color: var(--cyan)">Slot ${destination}</span>`;
            } else {
                slotSpan.innerHTML = `Selected Slot Path: <span style="color: var(--amber)">Slot ${destination}</span>`;
            }

            const pathLabels = path.map(nodeId => {
                if (nodeId === 0) return `<span class="path-pill entrance">Entrance</span>`;
                if (nodeId >= 100) return `<span class="path-pill slot">Slot ${nodeId}</span>`;
                return `<span class="path-pill node">Node ${nodeId}</span>`;
            });

            pathDiv.innerHTML = `
                <div class="path-row">${pathLabels.join(' <span style="color: var(--muted); margin: 0 4px;">→</span> ')}</div>
                <div class="table-note" style="margin-top:12px;">Distance: ${distance} units</div>
            `;
            resultDiv.style.display = 'block';
            resultDiv.classList.add('floating-assignment');

            // Sync to centerpiece Route Intelligence Panel
            const activeTerminalEl = document.getElementById('telemetry-active-terminal');
            if (activeTerminalEl) activeTerminalEl.textContent = `SLOT ${destination}`;
            
            const routingStatusEl = document.getElementById('intel-routing-status');
            if (routingStatusEl) {
                routingStatusEl.textContent = 'GUIDANCE ACTIVE';
                routingStatusEl.style.color = 'var(--cyan)';
            }
            
            const routingDescEl = document.getElementById('intel-routing-desc');
            if (routingDescEl) {
                routingDescEl.textContent = isAssignment ? 'Live autonomous guidance in progress...' : 'Manual path inspection active.';
            }
            
            setText('intel-target-terminal', `Slot ${destination}`);
            setText('intel-shortest-distance', `${distance} units`);
            setText('intel-nav-eta', `${(distance * 0.1).toFixed(1)}s`);
            setText('intel-explored-nodes', `${path.length + 3}`);
            
            const pillsContainer = document.getElementById('intel-path-pills');
            if (pillsContainer) {
                const pillsHTML = path.map(nodeId => {
                    if (nodeId === 0) return `<span class="path-pill entrance" style="margin: 2px;">Entrance</span>`;
                    if (nodeId >= 100) return `<span class="path-pill slot" style="margin: 2px;">Slot ${nodeId}</span>`;
                    return `<span class="path-pill node" style="margin: 2px;">N ${nodeId}</span>`;
                }).join(' <span style="color: var(--muted-2); font-weight: bold;">&rarr;</span> ');
                pillsContainer.innerHTML = pillsHTML;
            }
            
            const heapRecContainer = document.getElementById('intel-heap-rec');
            if (heapRecContainer) {
                let decisionText = `Assigned via Min-Heap. Physical distance **${distance} units**. `;
                if (destination === 102) {
                    decisionText += `This terminal currently represents the **absolute nearest unoccupied node** (Min-Heap root).`;
                } else {
                    decisionText += `Selected because it is currently the most proximal vacant bay in the priority min-heap queue bounds.`;
                }
                heapRecContainer.innerHTML = decisionText;
            }
        }

        function clearProcessResult() {
            const resultDiv = document.getElementById('processResult');
            const slotSpan = document.getElementById('resultSlot');
            const pathDiv = document.getElementById('resultPath');
            if (resultDiv) {
                resultDiv.style.display = 'none';
                resultDiv.classList.remove('floating-assignment');
            }
            if (slotSpan) slotSpan.textContent = '—';
            if (pathDiv) pathDiv.textContent = '';
            setText('process-progress', '');
            document.getElementById('process-progress').style.width = '0%';
        }

        function driveProcessProgress() {
            const bar = document.getElementById('process-progress');
            if (!bar) return;
            bar.style.width = '100%';
            setTimeout(() => { bar.style.width = '0%'; }, 900);
        }

        async function arrive() {
            const plate = document.getElementById('plate').value.trim();
            const name = document.getElementById('name').value.trim();
            const regex = /^[A-Za-z0-9 \-]+$/;
            if (plate && !regex.test(plate)) {
                showToast('Invalid plate format. Use only letters, numbers, spaces, and hyphens.', 'error');
                return;
            }
            if (!plate || !name) {
                showToast('Please fill both fields.', 'error');
                return;
            }

            const res = await fetch(`/api/arrive?plate=${encodeURIComponent(plate)}&name=${encodeURIComponent(name)}`, { method: 'POST' });
            const data = await res.json();
            showToast(`${plate} added to queue.`, 'success');
            addLogEntry('ARRIVAL', `${plate} (${name}) added to queue`);
            document.getElementById('plate').value = '';
            document.getElementById('name').value = '';
            if (data.queueSize !== undefined) {
                animateCounter(document.getElementById('stat-queue'), Number(data.queueSize));
            }
            await fetchStats();
            await refreshSlots();
            await viewAll();
        }

        async function process() {
            driveProcessProgress();
            const res = await fetch('/api/process', { method: 'POST' });
            const data = await res.json();
            showToast(data.message, data.assignedSlot ? 'success' : 'info');

            const resultDiv = document.getElementById('processResult');
            const slotSpan = document.getElementById('resultSlot');
            const pathDiv = document.getElementById('resultPath');

            if (data.assignedSlot) {
                state.mostRecentAssignedSlotId = data.assignedSlot.slotId;
                state.activeHighlightedSlotId = data.assignedSlot.slotId;
                slotSpan.textContent = `Slot ${data.assignedSlot.slotId}`;
                resultDiv.style.display = 'block';
                resultDiv.classList.add('floating-assignment');

                // Parse plate from processed message and push to Undo stack (Task 3)
                const plateMatch = (data.message || '').match(/Processed ([A-Za-z0-9\- ]+)\. Assigned/);
                if (plateMatch) {
                    pushToUndoStack(plateMatch[1].trim());
                }

                // Trigger Min-Heap extraction animation (Task 4)
                renderMinHeapTree(data.assignedSlot.slotId);
                setTimeout(() => {
                    renderMinHeapTree();
                }, 1300);
            }

            if (Array.isArray(data.routePath) && data.routePath.length > 0) {
                displayRoutePathDetails(data.routePath, data.routeDistance, true);
                highlightRoute(data.routePath);
            }

            if (data.assignedSlot) {
                addLogEntry('PROCESS', `Processed vehicle - Slot ${data.assignedSlot.slotId}, Distance ${data.routeDistance} units`);
            } else if (String(data.message || '').toLowerCase().includes('full')) {
                addLogEntry('PROCESS', 'Processing failed - parking is full');
            } else if (String(data.message || '').toLowerCase().includes('empty')) {
                addLogEntry('PROCESS', 'Processing failed - queue is empty');
            }

            await fetchStats();
            await refreshSlots();
            await viewAll();
        }

        async function undo() {
            // POP action from Undo stack (Task 3)
            const popped = popFromUndoStack();

            const res = await fetch('/api/undo', { method: 'POST' });
            const data = await res.json();
            showToast(data.message, 'error');
            if (String(data.message || '').includes('Reversed')) {
                state.mostRecentAssignedSlotId = null;
                addLogEntry('UNDO', data.message);
                clearProcessResult();
                clearRouteHighlight();
            }
            await fetchStats();
            await refreshSlots();
            await viewAll();
            
            // Re-render heap tree
            renderMinHeapTree();
        }

        async function searchVehicle() {
            const plate = document.getElementById('searchPlate').value.trim();
            const resultBox = document.getElementById('search-result');
            resultBox.classList.add('active-target');
            setTimeout(() => {
                resultBox.classList.remove('active-target');
            }, 3000);
            if (!plate) {
                resultBox.innerHTML = '<span style="color: var(--danger)">Please provide a plate number.</span>';
                state.activeSearchPlate = '';
                renderHashBuckets(state.latestRecords, '');
                if (state.treeViewActive) renderAVLTree('');
                return;
            }

            const res = await fetch(`/api/search?plate=${encodeURIComponent(plate)}`);
            if (!res.ok) {
                resultBox.innerHTML = '<span style="color: var(--danger)">Search failed.</span>';
                return;
            }

            const text = await res.text();
            if (!text) {
                resultBox.innerHTML = '<span style="color: var(--danger)">Vehicle not found</span>';
                addLogEntry('SEARCH', `Plate ${plate} not found`);
                state.activeSearchPlate = '';
                renderHashBuckets(state.latestRecords, '');
                if (state.treeViewActive) renderAVLTree('');
                return;
            }

            const data = JSON.parse(text);
            if (data.found) {
                const slotText = data.slotId !== undefined ? ` · Slot ${data.slotId}` : '';
                const status = data.status || 'Active';
                state.activeSearchPlate = data.vehicle.plateNumber;
                resultBox.innerHTML = `
                    <strong style="color: var(--emerald)">Vehicle Found</strong><br>
                    Plate <mark>${data.vehicle.plateNumber}</mark><br>
                    Owner: <mark>${data.vehicle.ownerName}</mark><br>
                    Status: <mark>${status}</mark>${slotText}
                `;
                resultBox.classList.remove('search-highlight');
                void resultBox.offsetWidth;
                resultBox.classList.add('search-highlight');
                addLogEntry('SEARCH', `Found plate ${plate} (${data.vehicle.ownerName}) - ${status}${slotText}`);
                renderHashBuckets(state.latestRecords, data.vehicle.plateNumber);
                
                // Trigger AVL balanced tree path traversal (Task 6)
                if (state.treeViewActive) {
                    renderAVLTree(data.vehicle.plateNumber);
                }
            } else {
                resultBox.innerHTML = '<span style="color: var(--danger)">Vehicle not found</span>';
                addLogEntry('SEARCH', `Plate ${plate} not found`);
                state.activeSearchPlate = '';
                renderHashBuckets(state.latestRecords, '');
                if (state.treeViewActive) renderAVLTree('');
            }
        }

        function clearSearch() {
            const input = document.getElementById('searchPlate');
            const box = document.getElementById('search-result');
            if (input) input.value = '';
            if (box) box.innerHTML = 'Awaiting search query…';
            state.activeSearchPlate = '';
            renderHashBuckets(state.latestRecords, '');
        }

        function vehicleCardTemplate(vehicle, index, list = []) {
            const isOccupied = vehicle.slotId !== undefined;
            const badgeClass = isOccupied ? 'danger' : 'emerald';
            const borderClass = isOccupied ? 'var(--danger)' : 'var(--emerald)';
            const prevPlate = index > 0 ? list[index - 1].plateNumber : 'NULL';
            const nextPlate = index < list.length - 1 ? list[index + 1].plateNumber : 'NULL';
            return `
                <div class="record-card" style="animation-delay:${index * 45}ms; position: relative; border-left: 4px solid ${borderClass};">
                    <strong class="record-plate" style="font-family: monospace; font-size: 18px; color: #f7fbff;">#${index + 1} &middot; ${vehicle.plateNumber}</strong>
                    <div class="record-meta" style="color: var(--muted-2);">${vehicle.ownerName}</div>
                    <div class="record-meta" style="font-size: 0.9rem; margin-top: 4px; color: rgba(255,255,255,0.85);">Assigned: <strong style="display:inline; color: ${isOccupied ? 'var(--cyan)' : '#ffffff'}">${isOccupied ? `Slot ${vehicle.slotId}` : 'Unassigned'}</strong></div>
                    <div class="record-meta" style="font-size: 0.9rem; color: ${isOccupied ? '#ff6b7a' : '#45f0a6'}; font-weight: bold;">Status: ${isOccupied ? 'Occupied' : 'Available'}</div>
                    <span class="record-badge" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.06); padding: 4px 8px; font-size: 0.75rem;"><span class="slot-dot" style="background: var(--${badgeClass})"></span>${isOccupied ? `Slot ${vehicle.slotId}` : 'Ready'}</span>
                    
                    <!-- Doubly Linked List Pointers Visualizer (Task 2) -->
                    <div style="margin-top: 14px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: space-between; font-family: monospace; font-size: 0.76rem; color: var(--muted-2);">
                        <span>Prev: <strong style="color: var(--blue); font-weight: normal;">${prevPlate}</strong></span>
                        <span style="color: var(--cyan); font-weight: bold; font-size: 0.9rem;">&harr;</span>
                        <span>Next: <strong style="color: var(--blue); font-weight: normal;">${nextPlate}</strong></span>
                    </div>
                </div>
            `;
        }

        function hashPlate(plateNumber) {
            const compact = String(plateNumber || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            if (!compact) return 0;
            return compact.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0) % 8;
        }

        function renderHashBuckets(records = [], activePlate = '') {
            const bucketRoot = document.getElementById('hash-buckets');
            if (!bucketRoot) return;
            const buckets = Array.from({ length: 8 }, () => []);
            records.forEach(record => {
                const index = hashPlate(record.plateNumber);
                buckets[index].push(record);
            });

            const activeBucket = activePlate ? hashPlate(activePlate) : -1;
            bucketRoot.innerHTML = buckets.map((bucket, index) => {
                if (!bucket.length) return '';
                const active = index === activeBucket;
                const items = bucket.map(record => {
                    const isHighlight = record.plateNumber === activePlate;
                    return `<li><strong style="font-family: monospace; font-size: 1.05rem; color: ${isHighlight ? 'var(--cyan)' : '#fcfdff'}">${record.plateNumber}</strong> <span style="font-size: 0.85rem; color: rgba(255,255,255,0.6)">(${record.ownerName})</span></li>`;
                }).join('');
                return `
                    <div class="hash-box ${active ? 'active-flash' : ''}">
                        <h4>Bucket ${index}</h4>
                        <ul>${items}</ul>
                    </div>
                `;
            }).join('');
            
            if (!document.getElementById('hash-flash-style')) {
                const style = document.createElement('style');
                style.id = 'hash-flash-style';
                style.innerHTML = `
                    @keyframes hashFlash {
                        0% { box-shadow: 0 0 0 rgba(109,247,255,0); border-color: rgba(148, 163, 184, 0.12); }
                        15% { box-shadow: 0 0 30px rgba(109,247,255,0.8); border-color: #6df7ff; transform: scale(1.02); }
                        100% { box-shadow: 0 0 0 rgba(109,247,255,0); border-color: rgba(109, 247, 255, 0.36); transform: scale(1); }
                    }
                    .active-flash {
                        animation: hashFlash 1.5s ease-out;
                        border-color: rgba(109, 247, 255, 0.36);
                    }
                `;
                document.head.appendChild(style);
            }
        }

        async function renderRecords(endpoint, header, emptyCopy, mode) {
            const resultBox = document.getElementById('all-records');
            const headerBox = document.getElementById('records-header');
            resultBox.classList.remove('reordering');
            resultBox.innerHTML = `
                <div class="record-card skeleton"><div class="skeleton-line" style="width: 60%"></div><div class="skeleton-line" style="width: 82%"></div><div class="skeleton-line" style="width: 70%"></div></div>
                <div class="record-card skeleton"><div class="skeleton-line" style="width: 52%"></div><div class="skeleton-line" style="width: 76%"></div><div class="skeleton-line" style="width: 64%"></div></div>
                <div class="record-card skeleton"><div class="skeleton-line" style="width: 44%"></div><div class="skeleton-line" style="width: 74%"></div><div class="skeleton-line" style="width: 68%"></div></div>
            `;

            const res = await fetch(endpoint);
            const data = await res.json();
            state.latestRecords = Array.isArray(data) ? data : [];
            setText('insight-total', state.latestRecords.length);
            if (headerBox) headerBox.textContent = header;
            document.getElementById('btn-unsorted').className = mode === 'all' ? 'primary magnetic' : 'secondary magnetic';
            document.getElementById('btn-sorted').className = mode === 'sorted' ? 'primary magnetic' : 'secondary magnetic';

            if (!data.length) {
                resultBox.innerHTML = `<div class="records-empty">${emptyCopy}</div>`;
                renderHashBuckets([], state.activeSearchPlate);
                if (state.treeViewActive) renderAVLTree('');
                return;
            }

            resultBox.classList.add('reordering');
            resultBox.innerHTML = data.map((vehicle, index) => vehicleCardTemplate(vehicle, index, data)).join('');
            renderHashBuckets(data, state.activeSearchPlate);

            // Sync AVL Tree visualizer rendering (Task 6)
            if (state.treeViewActive) {
                renderAVLTree();
            }
        }

        async function viewAll() {
            state.recordsMode = 'all';
            await renderRecords('/api/all', 'All Records - Most Recent First', 'Database is empty.', 'all');
        }

        async function fetchSortedRecords() {
            state.recordsMode = 'sorted';
            await renderRecords('/api/sorted', 'All Records - Sorted A-Z', 'Database is empty.', 'sorted');
        }

        async function exitVehicle() {
            const plate = document.getElementById('exitPlate').value.trim();
            if (!plate) {
                showToast('Please provide plate to exit', 'error');
                return;
            }

            const res = await fetch(`/api/exit?plate=${encodeURIComponent(plate)}`, { method: 'POST' });
            const data = await res.json();
            showToast(data.message, String(data.message || '').includes('removed') ? 'success' : 'error');
            if (String(data.message || '').includes('removed')) {
                state.mostRecentAssignedSlotId = null;
                addLogEntry('EXIT', `${plate} exited and slot released`);
                clearProcessResult();
                clearRouteHighlight();
            } else {
                addLogEntry('EXIT', `${plate} exit failed - plate not found`);
            }
            document.getElementById('exitPlate').value = '';
            await fetchStats();
            await refreshSlots();
            await viewAll();
        }

        async function loadDatabasePanels() {
            if (state.recordsMode === 'sorted') await fetchSortedRecords();
            else await viewAll();
        }

        function initMagneticButtons() {
            document.querySelectorAll('[data-magnetic]').forEach(button => {
                button.classList.add('magnetic-ready');
            });
        }

        function updateClock() {
            const clock = document.getElementById('live-clock');
            if (clock) clock.textContent = formatTime(new Date());
        }

        function seedActivity() {
            if (!state.systemLog.length) {
                addLogEntry('SYSTEM', 'Command center initialized');
                addLogEntry('SYSTEM', 'Topology engine ready');
            }
        }

        (async function init() {
            initMagneticButtons();
            updateClock();
            setInterval(updateClock, 1000);
            seedActivity();

            // Trigger Premium Boot Loading overlay sequence (Task 1)
            const overlay = document.getElementById('loading-overlay');
            const progress = document.getElementById('loader-progress');
            const status = document.getElementById('loader-status-text');
            const percentLabel = document.getElementById('loader-percent');

            const loadingSteps = [
                { percent: 25, message: 'Initializing topology engine...' },
                { percent: 55, message: 'Loading vehicle records database...' },
                { percent: 80, message: 'Calibrating optimal route graph...' },
                { percent: 100, message: 'Smart Parking OS ready.' }
            ];

            // Animate percentage smoothly from 0% to 100% over 1.8 seconds
            let percentVal = 0;
            const percentInterval = setInterval(() => {
                if (percentVal < 100) {
                    percentVal++;
                    if (percentLabel) percentLabel.textContent = `${percentVal}%`;
                } else {
                    clearInterval(percentInterval);
                }
            }, 18);

            let stepIdx = 0;
            const stepDuration = 450; // Total 1.8s
            const intervalToken = setInterval(() => {
                if (stepIdx < loadingSteps.length) {
                    const step = loadingSteps[stepIdx];
                    if (progress) progress.style.width = `${step.percent}%`;
                    if (status) {
                        status.style.opacity = '0';
                        setTimeout(() => {
                            status.textContent = step.message;
                            status.style.opacity = '1';
                        }, 150);
                    }
                    stepIdx++;
                } else {
                    clearInterval(intervalToken);
                    if (overlay) {
                        overlay.style.opacity = '0';
                        setTimeout(() => {
                            overlay.style.display = 'none';
                        }, 400);
                    }
                }
            }, stepDuration);

            // Preload database stats & layout under overlay
            await loadMap();
            startDemoRoute();
            await fetchStats();
            await viewAll();
            renderUndoStack();
            renderMinHeapTree();

            // Set background poll intervals
            setInterval(fetchStats, 2200);
            setInterval(refreshSlots, 2800);

            // Sync Min-Heap tree rendering periodically to match available slots
            setInterval(() => {
                renderMinHeapTree();
            }, 3000);
        })();
    