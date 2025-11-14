document.addEventListener('DOMContentLoaded', () => {
    console.log("Starting CZN Calculator...");

    // --- GLOBAL STATE ---
    let zones = [];
    let zoneCounter = 0;
    let currentLang = 'th';
    let draggedCharName = null;
    const APP_STATE_KEY = 'cznCalculatorState';

    // --- TRANSLATIONS ---
    const translations = {
        th: {
            main_header: "CZN Save Data Value Calculator",
            last_updated: "อัปเดตล่าสุด: 14-11-2025",
            characters_header: "ตัวละคร",
            add_zone_button: "เพิ่มโซนคำนวณ",
            clear_all_button: "ล้างข้อมูลทั้งหมด",
            ref_table_header: "Point Value Reference",
            ref_table_item: "รายการ (Item)",
            ref_table_points: "ค่าคะแนน (Points)",
            ref_base_card: "Base/Starting Card",
            ref_normal_epi: "- Normal Epiphany (ต่อการ์ด)",
            ref_divine_epi: "- Divine Epiphany (ต่อการ์ด)",
            ref_conversion: "Card Conversion (การแปลงการ์ด)",
            ref_removal: "Card Removal (การลบการ์ด)",
            removal_note: "ลบการ์ดครั้งแรกฟรี (ถ้าไม่ใช่ Base Card)",
            ref_duplication: "Card Duplication (การซ้ำการ์ด)",
            duplication_note: "ก็อปการ์ดใบแรกฟรี",
            ref_extra_penalty_header: "<strong>บทลงโทษเพิ่มเติม (Extra Penalty)</strong>",
            ref_extra_penalty_desc: "- เมื่อลบ Base Card",
            footer_developed_by: "Developed by ohm41321",
            footer_donate: "Donate",
            character_label: "ตัวละคร",
            chaos_tier_label: "Chaos Tier:",
            neutral_cards: "Neutral Cards",
            monster_cards: "Monster Cards",
            add_neutral_card: "เพิ่ม Neutral Card",
            add_monster_card: "เพิ่ม Monster Card",
            card_type_none: "ไม่มี",
            card_type_normal: "Normal Epiphany",
            card_type_divine: "Divine Epiphany",
            card_conversion: "Card Conversion",
            card_removal: "Card Removal",
            base_cards_removed: "Base Cards ที่ถูกลบ",
            card_duplication: "Card Duplication",
            total_value: "Total Value",
            status: "Status",
            safe: "Safe",
            warning: "Warning",
            note: "Note: ค่าเหล่านี้เป็นค่าประมาณการและอาจแตกต่างกันไปขึ้นอยู่กับการอัปเดตเกม"
        },
        en: {
            main_header: "CZN Save Data Value Calculator",
            last_updated: "Last Updated: 14-11-2025",
            characters_header: "Characters",
            add_zone_button: "Add Calculation Zone",
            clear_all_button: "Clear All Data",
            ref_table_header: "Point Value Reference Table",
            ref_table_item: "Item",
            ref_table_points: "Points",
            ref_base_card: "Base/Starting Card",
            ref_normal_epi: "- Normal Epiphany (Card Chain)",
            ref_divine_epi: "- Divine Epiphany (Card Chain)",
            ref_conversion: "Card Conversion",
            ref_removal: "Card Removal",
            removal_note: "First removal is free (if not base card)",
            ref_duplication: "Card Duplication",
            duplication_note: "First duplication is free",
            base_cards_removed: "Base Cards Removed",
            ref_extra_penalty_header: "<strong>Extra Penalty</strong>",
            ref_extra_penalty_desc: "- When removing Base Card",
            footer_developed_by: "Developed by ohm41321",
            footer_donate: "Donate",
            character_label: "Character",
            chaos_tier_label: "Chaos Tier:",
            neutral_cards: "Neutral Cards",
            monster_cards: "Monster Cards",
            add_neutral_card: "Add Neutral Card",
            add_monster_card: "Add Monster Card",
            card_type_none: "None",
            card_type_normal: "Normal Epiphany",
            card_type_divine: "Divine Epiphany",
            card_conversion: "Card Conversion",
            card_removal: "Card Removal",
            card_duplication: "Card Duplication",
            total_value: "Total Value",
            status: "Status",
            safe: "Safe",
            warning: "Warning",
            note: "Note: Values are estimates and may vary based on game updates."
        }
    };

    // --- STATE MANAGEMENT ---
    function saveState() {
        const state = {
            zones,
            zoneCounter,
            tier: document.getElementById('chaos-tier-select').value,
            lang: currentLang
        };
        localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
    }

    function loadState() {
        const savedState = localStorage.getItem(APP_STATE_KEY);
        if (savedState) {
            const data = JSON.parse(savedState);
            zones = data.zones || [];
            zoneCounter = data.zoneCounter || 0;
            document.getElementById('chaos-tier-select').value = data.tier || 13;
            currentLang = data.lang || 'th';
        }
    }

    function updateState(updateFunction) {
        return function(...args) {
            const result = updateFunction(...args);
            saveState();
            return result;
        };
    }

    // --- INITIALIZATION ---
    function initialize() {
        populateCharacterPalette();
        populateTierSelector();
        loadState(); // Load state before setting up controls and rendering
        setupLangSwitcher();
        setupGlobalControls();
        renderAllZones();
        updateTranslations();
    }

    function setupLangSwitcher() {
        const langButtons = document.querySelectorAll('.lang-switcher button');
        langButtons.forEach(b => b.classList.remove('active'));
        document.querySelector(`.lang-switcher button[data-lang="${currentLang}"]`).classList.add('active');

        langButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                currentLang = btn.dataset.lang;
                langButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                updateState(updateTranslations)();
            });
        });
    }

    function populateTierSelector() {
        const tierSelect = document.getElementById('chaos-tier-select');
        for (let i = 1; i <= 13; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Tier ${i}`;
            tierSelect.appendChild(option);
        }
    }

    function setupGlobalControls() {
        document.getElementById('add-zone-btn').addEventListener('click', updateState(addZone));
        document.getElementById('clear-state-btn').addEventListener('click', updateState(clearAll));
        document.getElementById('chaos-tier-select').addEventListener('change', updateState(() => zones.forEach(updateZoneCalculations)));
    }

    function updateTranslations() {
        const elements = document.querySelectorAll('[data-translate-key]');
        elements.forEach(el => {
            const key = el.dataset.translateKey;
            if (translations[currentLang] && translations[currentLang][key]) {
                el.innerHTML = translations[currentLang][key];
            }
        });
        zones.forEach(zone => {
            renderCards(zone, 'neutral');
            renderCards(zone, 'monster');
            updateZoneCalculations(zone);
        });
    }

    function populateCharacterPalette() {
        const characterPalette = document.getElementById('character-palette');
        if (!characterPalette) return;
        const characterImages = [
            'Amir.png', 'Beryl.png', 'Cassius.png',
            'Euphina.png', 'Haru.png', 'Hugo.png', 'Kayron.png', 'Khalipe.png',
            'Lucas.png', 'Luke.png', 'Magna.png', 'Maribell.png', 'Mei Lin.png',
            'Mika.png', 'Nia.png', 'Orlea.png', 'Owen.png', 'Rei.png',
            'Renoa.png', 'Rin.png', 'Selena.png', 'Tressa.png', 'Veronica.png', 'Yuki.png', 'Chizuru.png'
        ];
        //'Narja.png', 'Adelheid.png',
        characterImages.forEach(imgName => {
            const container = document.createElement('div');
            container.className = 'char-item-container';
            if (imgName === 'Yuki.png' || imgName === 'Chizuru.png' ) {
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
            img.dataset.charName = charTitle;
            const name = document.createElement('span');
            name.className = 'char-item-name';
            name.textContent = charTitle;
            container.appendChild(img);
            container.appendChild(name);
            characterPalette.appendChild(container);
        });
    }

    // --- ZONE & UI RENDERING ---
    function renderAllZones() {
        const zonesContainer = document.getElementById('zones-container');
        zonesContainer.innerHTML = '';
        zones.forEach(renderZone);
    }

    function renderZone(zone) {
        const calculatorContainer = document.createElement('div');
        calculatorContainer.className = 'calculator-container';
        calculatorContainer.id = zone.id;
        calculatorContainer.innerHTML = `
            <button class="remove-zone-btn" data-zone-id="${zone.id}">×</button>
            <div class="character-dropzone" data-zone-id="${zone.id}"><p>Drop character here</p></div>
            <div class="section">
                <div class="card-type-group">
                    <div class="card-type-header">
                        <span data-translate-key="neutral_cards"></span>
                        <span class="card-category-total">Total: <span class="neutral-total">0</span></span>
                    </div>
                    <div class="card-list neutral-card-list"></div>
                    <button class="btn add-card-btn" data-card-type="neutral" data-translate-key="add_neutral_card"></button>
                </div>
                <div class="card-type-group">
                    <div class="card-type-header">
                        <span data-translate-key="monster_cards"></span>
                        <span class="card-category-total">Total: <span class="monster-total">0</span></span>
                    </div>
                    <div class="card-list monster-card-list"></div>
                    <button class="btn add-card-btn" data-card-type="monster" data-translate-key="add_monster_card"></button>
                </div>
                <div class="section">
                    <div class="input-group">
                        <label data-translate-key="card_conversion"></label>
                        <div class="input-stepper">
                            <button class="stepper-btn minus" data-field="conversion">-</button>
                            <input type="number" class="tier-input conversion" value="${zone.inputs.conversion || 0}" min="0">
                            <button class="stepper-btn plus" data-field="conversion">+</button>
                        </div>
                    </div>
                    <div class="input-group">
                        <label data-translate-key="card_removal"></label>
                        <div class="input-stepper">
                            <button class="stepper-btn minus" data-field="removal">-</button>
                            <input type="number" class="tier-input removal" value="${zone.inputs.removal || 0}" min="0">
                            <button class="stepper-btn plus" data-field="removal">+</button>
                        </div>
                    </div>
                    <div class="action-note" data-translate-key="removal_note"></div>
                    <div class="input-group">
                        <label data-translate-key="base_cards_removed"></label>
                        <div class="input-stepper">
                            <button class="stepper-btn minus" data-field="removal_base">-</button>
                            <input type="number" class="tier-input removal-base" value="${zone.inputs.removal_base || 0}" min="0">
                            <button class="stepper-btn plus" data-field="removal_base">+</button>
                        </div>
                    </div>
                    <div class="input-group">
                        <label data-translate-key="card_duplication"></label>
                        <div class="input-stepper">
                            <button class="stepper-btn minus" data-field="duplication">-</button>
                            <input type="number" class="tier-input duplication" value="${zone.inputs.duplication || 0}" min="0">
                            <button class="stepper-btn plus" data-field="duplication">+</button>
                        </div>
                    </div>
                    <div class="action-note" data-translate-key="duplication_note"></div>
                </div>
                <div class="result-section">
                    <div class="total-value-container">
                        <span data-translate-key="total_value"></span>
                        <div><span class="total-value">0</span> / <span class="memory-cap">150</span></div>
                    </div>
                    <div class="status"></div>
                    <div class="note" data-translate-key="note"></div>
                </div>
            </div>
        `;
        document.getElementById('zones-container').appendChild(calculatorContainer);
        
        if (zone.character) {
            setZoneCharacter(zone, zone.character, false);
        }
        
        setupZoneEvents(calculatorContainer, zone);
        updateTranslations();
    }

    function addZone() {
        zoneCounter++;
        const zone = { id: `zone-${zoneCounter}`, character: null, neutralCards: [], monsterCards: [], inputs: {} };
        zones.push(zone);
        renderZone(zone);
    }

    function setupZoneEvents(container, zone) {
        container.querySelector('.remove-zone-btn').addEventListener('click', updateState(() => {
            const zoneIndex = zones.findIndex(z => z.id === zone.id);
            if (zoneIndex > -1) zones.splice(zoneIndex, 1);
            renderAllZones();
        }));
        const dropzone = container.querySelector('.character-dropzone');
        dropzone.addEventListener('dragover', handleDragOver);
        dropzone.addEventListener('drop', (e) => handleDrop(e, zone));
        dropzone.addEventListener('dragleave', handleDragLeave);

        container.querySelectorAll('.add-card-btn').forEach(btn => {
            btn.addEventListener('click', updateState(() => addCardToZone(zone, btn.dataset.cardType)));
        });

        container.querySelectorAll('.stepper-btn').forEach(btn => {
            btn.addEventListener('click', (e) => handleStepper(e, zone));
        });

        container.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('change', updateState(() => updateZoneCalculations(zone)));
            input.addEventListener('input', updateState(() => updateZoneCalculations(zone)));
        });
    }

    function clearAll() {
        zones = [];
        zoneCounter = 0;
        renderAllZones();
    }

    // --- CARD MANAGEMENT ---
    function addCardToZone(zone, cardType) {
        const cardArray = cardType === 'neutral' ? zone.neutralCards : zone.monsterCards;
        cardArray.push({ id: Date.now(), type: 'none' });
        renderCards(zone, cardType);
        updateZoneCalculations(zone);
    }

    function renderCards(zone, cardType) {
        const container = document.querySelector(`#${zone.id} .${cardType}-card-list`);
        if (!container) return;
        container.innerHTML = '';
        const cardArray = cardType === 'neutral' ? zone.neutralCards : zone.monsterCards;

        cardArray.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card-item';
            cardEl.innerHTML = `
                <span>Card ${index + 1}</span>
                <select class="card-type-select" data-card-id="${card.id}">
                    <option value="none" ${card.type === 'none' ? 'selected' : ''} data-translate-key="card_type_none">${translations[currentLang].card_type_none}</option>
                    <option value="normal" ${card.type === 'normal' ? 'selected' : ''} data-translate-key="card_type_normal">${translations[currentLang].card_type_normal}</option>
                    <option value="divine" ${card.type === 'divine' ? 'selected' : ''} data-translate-key="card_type_divine">${translations[currentLang].card_type_divine}</option>
                </select>
                <button class="btn-remove-card" data-card-id="${card.id}">×</button>
            `;
            container.appendChild(cardEl);

            cardEl.querySelector('.card-type-select').addEventListener('change', updateState((e) => {
                card.type = e.target.value;
                updateZoneCalculations(zone);
            }));

            cardEl.querySelector('.btn-remove-card').addEventListener('click', updateState(() => {
                const cardIndex = cardArray.findIndex(c => c.id === card.id);
                if (cardIndex > -1) {
                    cardArray.splice(cardIndex, 1);
                    renderCards(zone, cardType);
                    updateZoneCalculations(zone);
                }
            }));
        });
    }

    // --- DRAG & DROP ---
    function handleDragOver(e) {
        e.preventDefault();
        const dropzone = e.currentTarget;
        if (dropzone.classList.contains('has-char')) return;
        dropzone.classList.add('drag-over');
        if (draggedCharName && !dropzone.querySelector('.drop-preview-img')) {
            dropzone.innerHTML = `<img src="character/${draggedCharName}.png" class="drop-preview-img">`;
        }
    }

    function handleDragLeave(e) {
        const dropzone = e.currentTarget;
        if (dropzone.classList.contains('has-char')) return;
        dropzone.classList.remove('drag-over');
        if (dropzone.querySelector('.drop-preview-img')) {
            dropzone.innerHTML = '<p data-translate-key="character_label"></p>';
            updateTranslations();
        }
    }

    function handleDrop(e, zone) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const charName = e.dataTransfer.getData('text/plain');
        if (charName) {
            updateState(setZoneCharacter)(zone, charName, true);
        }
    }

    function setZoneCharacter(zone, charName, animate = true) {
        zone.character = charName;
        const dropzone = document.querySelector(`.character-dropzone[data-zone-id="${zone.id}"]`);
        dropzone.innerHTML = `
            <button class="char-reset-btn" data-zone-id="${zone.id}">×</button>
            <img src="character/${charName}.png" class="dropped-char-img ${animate ? 'animate-pop-in' : ''}" alt="${charName}">
            <div class="char-name">${charName}</div>`;
        dropzone.classList.add('has-char');
        dropzone.querySelector('.char-reset-btn').addEventListener('click', updateState(() => resetZoneCharacter(zone)));
    }

    function resetZoneCharacter(zone) {
        zone.character = null;
        const dropzone = document.querySelector(`.character-dropzone[data-zone-id="${zone.id}"]`);
        dropzone.innerHTML = '<p data-translate-key="character_label"></p>';
        dropzone.classList.remove('has-char');
        updateTranslations();
        updateZoneCalculations(zone);
    }

    // --- CALCULATIONS & UPDATES ---
    const handleStepper = updateState((e, zone) => {
        const btn = e.target;
        const field = btn.dataset.field;
        const input = btn.parentElement.querySelector('input');
        let value = parseInt(input.value) || 0;
        if (btn.classList.contains('plus')) value++;
        else if (btn.classList.contains('minus')) value = Math.max(0, value - 1);
        input.value = value;
        zone.inputs[field] = value;
        updateZoneCalculations(zone);
    });

    function getMemoryCap(tier) {
        const parsedTier = parseInt(tier, 10);
        return isNaN(parsedTier) || parsedTier < 1 ? 30 : 20 + (parsedTier * 10);
    }

    function calculateProgressiveTotal(count) {
        if (count <= 1) return 0;
        let totalCost = 0;
        if (count >= 2) totalCost += 10;
        for (let i = 3; i <= count; i++) totalCost += 10 + (i - 2) * 20;
        return totalCost;
    }

    function updateZoneCalculations(zone) {
        const container = document.getElementById(zone.id);
        if (!container) return;

        const conversion = zone.inputs.conversion || 0;
        const removal = zone.inputs.removal || 0;
        const removalBase = zone.inputs.removal_base || 0;
        const duplication = zone.inputs.duplication || 0;

        let neutralTotal = 0;
        zone.neutralCards.forEach(card => {
            neutralTotal += 20;
            if (card.type === 'normal') neutralTotal += 10;
            if (card.type === 'divine') neutralTotal += 20;
        });

        let monsterTotal = 0;
        zone.monsterCards.forEach(card => {
            monsterTotal += 80;
            if (card.type === 'normal') monsterTotal += 10;
            if (card.type === 'divine') monsterTotal += 20;
        });

        const totalValue = neutralTotal + monsterTotal + (conversion * 10) + calculateProgressiveTotal(removal) + calculateProgressiveTotal(duplication) + (removalBase * 20);
        const memoryCap = getMemoryCap(document.getElementById('chaos-tier-select').value);

        container.querySelector('.neutral-total').textContent = neutralTotal;
        container.querySelector('.monster-total').textContent = monsterTotal;
        container.querySelector('.total-value').textContent = totalValue;
        container.querySelector('.memory-cap').textContent = memoryCap;

        const statusEl = container.querySelector('.status');
        if (totalValue <= memoryCap) {
            statusEl.className = 'status safe';
            statusEl.textContent = translations[currentLang].safe;
        } else {
            statusEl.className = 'status warning';
            statusEl.textContent = translations[currentLang].warning;
        }
    }

    // --- GLOBAL DRAG LISTENERS ---
    document.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('char-img')) {
            draggedCharName = e.target.dataset.charName;
            e.dataTransfer.setData('text/plain', draggedCharName);
        }
    });

    document.addEventListener('dragend', () => {
        draggedCharName = null;
        document.querySelectorAll('.character-dropzone:not(.has-char)').forEach(dz => {
            dz.classList.remove('drag-over');
            dz.innerHTML = '<p data-translate-key="character_label"></p>';
        });
        updateTranslations();
    });

    // --- START APP ---
    initialize();
});
