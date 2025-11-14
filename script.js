document.addEventListener('DOMContentLoaded', () => {
    const addZoneBtn = document.getElementById('add-zone-btn');
    const clearStateBtn = document.getElementById('clear-state-btn');
    const zonesContainer = document.getElementById('zones-container');
    const characterPalette = document.getElementById('character-palette');
    let zoneIdCounter = 0;
    const MAX_ZONES = 3;
    const LOCAL_STORAGE_KEY = 'cznCalculatorState';

    const characterImages = [
        'Adelheid.png', 'Amir.png', 'Beryl.png', 'Cassius.png', 'Chizuru.png', 
        'Euphina.png', 'Haru.png', 'Hugo.png', 'Kayron.png', 'Khalipe.png', 
        'Lucas.png', 'Luke.png', 'Magna.png', 'Maribell.png', 'Mei Lin.png', 
        'Mika.png', 'Narja.png', 'Nia.png', 'Orlea.png', 'Owen.png', 'Rei.png', 
        'Renoa.png', 'Rin.png', 'Selena.png', 'Tressa.png', 'Veronica.png', 'Yuki.png'
    ];

    // --- 1. State Management (localStorage) ---
    function saveState() {
        const zones = document.querySelectorAll('.calculator-container');
        const state = Array.from(zones).map(zone => {
            const zoneId = parseInt(zone.id.replace('zone-', ''));
            const inputs = {};
            zone.querySelectorAll('input[type="number"]').forEach(input => {
                inputs[input.dataset.inputId] = input.value;
            });

            const charDropzone = zone.querySelector('.character-dropzone');
            let character = null;
            if (charDropzone.classList.contains('has-char')) {
                const img = charDropzone.querySelector('.dropped-char-img');
                character = {
                    src: img.src,
                    title: img.title
                };
            }

            return {
                id: zoneId,
                tier: zone.querySelector('.tier-select').value,
                inputs: inputs,
                character: character
            };
        });
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    }

    function loadState() {
        const savedState = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedState) {
            const state = JSON.parse(savedState);
            if (state.length > 0) {
                // Find the max ID to prevent reuse
                zoneIdCounter = Math.max(...state.map(s => s.id)) + 1;
                
                state.forEach(zoneData => {
                    addZone(zoneData); // Pass data to populate the zone
                });
            } else {
                addZone(); // Add one default zone if saved state is empty array
            }
        } else {
            addZone(); // Add one default zone if no saved state
        }
    }

    function clearState() {
        if (confirm('คุณต้องการล้างข้อมูลที่บันทึกไว้ทั้งหมดใช่หรือไม่?')) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            location.reload();
        }
    }

    // --- 2. UI & Zone Creation ---
    function populateCharacters() {
        characterImages.forEach(imgName => {
            const container = document.createElement('div');
            container.className = 'char-item-container';

            // Add a 'New!' badge for Yuki
            if (imgName === 'Yuki.png') {
                const badge = document.createElement('span');
                badge.className = 'new-badge';
                badge.textContent = 'New!';
                container.appendChild(badge);
            }

            const img = document.createElement('img');
            img.src = `character/${imgName}`;
            img.className = 'char-img';
            img.draggable = true;
            const charTitle = imgName.replace('.png', '');
            img.title = charTitle;

            const name = document.createElement('span');
            name.className = 'char-item-name';
            name.textContent = charTitle;

            img.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.src);
                e.dataTransfer.setData('text/title', e.target.title);
            });

            container.appendChild(img);
            container.appendChild(name);
            characterPalette.appendChild(container);
        });
    }

    function addZone(zoneData = null) {
        if (zonesContainer.children.length >= MAX_ZONES) return;
        
        const newZoneId = zoneData ? zoneData.id : zoneIdCounter++;
        const zoneHtml = getCalculatorTemplate(newZoneId);
        zonesContainer.insertAdjacentHTML('beforeend', zoneHtml);
        const newZone = document.getElementById(`zone-${newZoneId}`);

        if (zoneData) {
            populateZone(newZone, zoneData);
        }

        addZoneEventListeners(newZone, newZoneId);
        calculateTotal(newZoneId);
        updateAddButtonState();
        if (!zoneData) saveState(); // Save state when a new blank zone is added
    }
    
    function populateZone(zone, data) {
        zone.querySelector('.tier-select').value = data.tier;
        for (const [inputId, value] of Object.entries(data.inputs)) {
            const inputElement = zone.querySelector(`[data-input-id="${inputId}"]`);
            if (inputElement) inputElement.value = value;
        }
        if (data.character) {
            const dropzone = zone.querySelector('.character-dropzone');
            dropzone.innerHTML = `
                <img src="${data.character.src}" class="dropped-char-img" title="${data.character.title}">
                <div class="char-name">${data.character.title}</div>
                <button class="char-reset-btn" title="ลบตัวละคร">&times;</button>
            `;
            dropzone.classList.add('has-char');
        }
    }

    function removeZone(zoneId) {
        const zoneToRemove = document.getElementById(`zone-${zoneId}`);
        if (zoneToRemove) {
            zoneToRemove.remove();
            updateAddButtonState();
            saveState();
        }
    }

    function updateAddButtonState() {
        addZoneBtn.disabled = zonesContainer.children.length >= MAX_ZONES;
    }

    // --- 3. Calculation ---
    function calculateTotal(zoneId) {
        const zone = document.getElementById(`zone-${zoneId}`);
        if (!zone) return;
        const getVal = (inputId) => parseInt(zone.querySelector(`#zone-${zoneId}-${inputId}`).value) || 0;
        const tierMax = parseInt(zone.querySelector('.tier-select').value);
        let totalValue = 0;
        totalValue += getVal('neutral-cards') * 20;
        totalValue += getVal('monster-cards') * 80;
        totalValue += getVal('epiphany-cards') * 10;
        totalValue += getVal('divine-epiphanies') * 20;
        totalValue += getVal('forbidden-cards') * 20;
        const totalRemoved = getVal('removed-normal') + getVal('removed-character') + getVal('removed-epiphany');
        const removedPenalties = [0, 10, 30, 50];
        for (let i = 1; i <= totalRemoved; i++) {
            if (i === 1) continue;
            if (i <= 4) totalValue += removedPenalties[i-1];
            else totalValue += 70;
        }
        totalValue += getVal('removed-character') * 20;
        totalValue += getVal('removed-epiphany') * 20;
        const totalDuplicated = getVal('duplicated-normal') + getVal('duplicated-epiphany') + getVal('duplicated-divine');
        const duplicatePenalties = [0, 10, 30, 50];
        for (let i = 1; i <= totalDuplicated; i++) {
            if (i === 1) continue;
            if (i <= 4) totalValue += duplicatePenalties[i-1];
            else totalValue += 70;
        }
        totalValue += getVal('duplicated-epiphany') * 10;
        totalValue += getVal('duplicated-divine') * 20;
        totalValue += getVal('converted-cards') * 10;
        const totalValueElement = zone.querySelector('.total-value');
        const statusMessageElement = zone.querySelector('.status');
        totalValueElement.textContent = totalValue;
        if (totalValue > tierMax) {
            statusMessageElement.textContent = `ค่าเกินกำหนด ${totalValue - tierMax} หน่วย (การ์ดอาจถูกลบ)`;
            statusMessageElement.className = 'status warning';
        } else {
            statusMessageElement.textContent = 'ปลอดภัย (การ์ดจะไม่ถูกลบ)';
            statusMessageElement.className = 'status safe';
        }
        // Save state after every calculation
        saveState();
    }

    // --- 4. Event Listeners ---
    function addZoneEventListeners(zone, zoneId) {
        zone.addEventListener('input', (e) => {
            if (e.target.matches('input[type="number"], select')) {
                calculateTotal(zoneId);
            }
        });
        zone.addEventListener('click', (e) => {
            if (e.target.matches('.stepper-btn')) {
                const button = e.target;
                const input = button.parentElement.querySelector('input[type="number"]');
                if (!input) return;
                let value = parseInt(input.value) || 0;
                if (button.classList.contains('plus')) value++;
                else if (button.classList.contains('minus')) value = Math.max(0, value - 1);
                input.value = value;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (e.target.matches('.remove-zone-btn')) removeZone(zoneId);
            if (e.target.matches('.char-reset-btn')) {
                const dropzone = zone.querySelector('.character-dropzone');
                dropzone.innerHTML = '<p>ลากตัวละครมาวางที่นี่</p>';
                dropzone.classList.remove('has-char');
                saveState();
            }
        });
        const dropzone = zone.querySelector('.character-dropzone');
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('drag-over');
        });
        dropzone.addEventListener('dragleave', () => {
            dropzone.classList.remove('drag-over');
        });
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('drag-over');
            const src = e.dataTransfer.getData('text/plain');
            const title = e.dataTransfer.getData('text/title');
            dropzone.innerHTML = `
                <img src="${src}" class="dropped-char-img" title="${title}">
                <div class="char-name">${title}</div>
                <button class="char-reset-btn" title="ลบตัวละคร">&times;</button>
            `;
            dropzone.classList.add('has-char');
            saveState();
        });
    }

    // --- 5. Initial Setup ---
    function getCalculatorTemplate(zoneId) {
        // This function is long, so it's placed here for better readability of the setup flow
        return `
            <div class="calculator-container" id="zone-${zoneId}">
                <div class="character-dropzone">
                    <p>ลากตัวละครมาวางที่นี่</p>
                </div>
                <button class="remove-zone-btn" data-zone-id="${zoneId}" title="ลบโซนนี้">&times;</button>
                <div class="section">
                    <h2>ระดับ Chaos (Tier)</h2>
                    <select class="tier-select" data-zone-id="${zoneId}">
                        <option value="30">Tier 1 (Max: 30)</option>
                        <option value="40">Tier 2 (Max: 40)</option>
                        <option value="50">Tier 3 (Max: 50)</option>
                        <option value="60">Tier 4 (Max: 60)</option>
                        <option value="70">Tier 5 (Max: 70)</option>
                        <option value="80">Tier 6 (Max: 80)</option>
                        <option value="90">Tier 7 (Max: 90)</option>
                        <option value="100">Tier 8 (Max: 100)</option>
                        <option value="110">Tier 9 (Max: 110)</option>
                        <option value="120">Tier 10 (Max: 120)</option>
                        <option value="130" selected>Tier 11 (Max: 130)</option>
                        <option value="140">Tier 12 (Max: 140)</option>
                    </select>
                </div>
                <div class="section">
                    <h2>ประเภทการ์ด</h2>
                    ${createInputGroup(zoneId, 'neutral-cards', 'Neutral Cards (20)')}
                    ${createInputGroup(zoneId, 'monster-cards', 'Monster Cards (80)')}
                    ${createInputGroup(zoneId, 'epiphany-cards', 'Epiphany (10)')}
                    ${createInputGroup(zoneId, 'divine-epiphanies', 'Divine Epiphanies (20)')}
                    ${createInputGroup(zoneId, 'forbidden-cards', 'Forbidden Cards (20)')}
                </div>
                <div class="section">
                    <h2>การลบการ์ด (Removed Cards)</h2>
                    ${createInputGroup(zoneId, 'removed-normal', 'จำนวนการ์ดทั่วไปที่ลบ')}
                    ${createInputGroup(zoneId, 'removed-character', 'จำนวนการ์ดตัวละครเริ่มต้นที่ลบ (+20)')}
                    ${createInputGroup(zoneId, 'removed-epiphany', 'จำนวนการ์ด Epiphany ที่ลบ (+20)')}
                </div>
                <div class="section">
                    <h2>การ์ดซ้ำ (Duplicate Cards)</h2>
                    ${createInputGroup(zoneId, 'duplicated-normal', 'จำนวนการ์ดทั่วไปที่ซ้ำ')}
                    ${createInputGroup(zoneId, 'duplicated-epiphany', 'จำนวน Epiphany ที่ซ้ำ (+10)')}
                    ${createInputGroup(zoneId, 'duplicated-divine', 'จำนวน Divine Epiphanies ที่ซ้ำ (+20)')}
                </div>
                <div class="section">
                    <h2>การแปลงการ์ด (Card Conversion)</h2>
                    ${createInputGroup(zoneId, 'converted-cards', 'จำนวนการ์ดที่แปลง (+10 ต่อใบ)')}
                </div>
                <div class="result-section">
                    <h2>ผลการคำนวณ</h2>
                    <div class="total-value-container">
                        <p>Total Save Data Value:</p>
                        <p class="total-value">0</p>
                    </div>
                    <div class="status"></div>
                    <p class="note">หมายเหตุ: Forbidden Cards จะไม่ถูกลบออกจากเด็ค</p>
                </div>
            </div>
        `;
    }

    function createInputGroup(zoneId, inputId, labelText) {
        const fullInputId = `zone-${zoneId}-${inputId}`;
        return `
            <div class="input-group">
                <label for="${fullInputId}">${labelText}</label>
                <div class="input-stepper">
                    <button class="stepper-btn minus" type="button">-</button>
                    <input type="number" id="${fullInputId}" data-input-id="${inputId}" min="0" value="0">
                    <button class="stepper-btn plus" type="button">+</button>
                </div>
            </div>
        `;
    }

    populateCharacters();
    addZoneBtn.addEventListener('click', () => addZone());
    clearStateBtn.addEventListener('click', clearState);
    loadState();
});