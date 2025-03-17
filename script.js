document.addEventListener('DOMContentLoaded', function() {
    // Initialize dayjs plugins
    dayjs.extend(window.dayjs_plugin_utc);
    dayjs.extend(window.dayjs_plugin_timezone);
    dayjs.extend(window.dayjs_plugin_customParseFormat);
    
    // DOM elements
    const timestampInput = document.getElementById('timestamp');
    const datetimeInput = document.getElementById('datetime');
    const timezoneSelect = document.getElementById('timezone');
    const infoBox = document.getElementById('info-box');
    const formatHint = document.getElementById('formatHint');
    
    // Default format
    const ISO_FORMAT = 'YYYY-MM-DD HH:mm:ss';
    
    // Common datetime formats for auto-detection
    const commonFormats = [
        ISO_FORMAT,
        'YYYY/MM/DD HH:mm:ss',
        'MM/DD/YYYY HH:mm:ss',
        'DD/MM/YYYY HH:mm:ss',
        'YYYY-MM-DDTHH:mm:ss.SSSZ',
        'YYYY-MM-DDTHH:mm:ssZ',
        'YYYY-MM-DDTHH:mm:ss',
        'DD-MM-YYYY HH:mm:ss',
        'MM-DD-YYYY HH:mm:ss',
        'MMMM D, YYYY HH:mm:ss',
        'D MMMM YYYY HH:mm:ss',
        'MMM D, YYYY HH:mm:ss',
        'D MMM YYYY HH:mm:ss'
    ];
    
    // Timezone list - populated on load
    const timezones = Intl.supportedValuesOf ? 
        Intl.supportedValuesOf('timeZone') : 
        [
            'UTC',
            'America/New_York',
            'America/Chicago',
            'America/Denver',
            'America/Los_Angeles',
            'Europe/London',
            'Europe/Berlin',
            'Europe/Moscow',
            'Asia/Tokyo',
            'Asia/Shanghai',
            'Australia/Sydney',
            'Pacific/Auckland'
        ];
    
    // Get browser's timezone
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Initialize timezone dropdown
    function initTimezoneDropdown() {
        timezones.forEach(timezone => {
            const option = document.createElement('option');
            option.value = timezone;
            option.textContent = timezone;
            if (timezone === localTimezone) {
                option.selected = true;
            }
            timezoneSelect.appendChild(option);
        });
    }
    
    // Update info box
    function updateInfoBox(message, type = 'info') {
        infoBox.textContent = message;
        infoBox.className = `alert alert-${type}`;
    }
    
    // Convert timestamp to datetime
    function timestampToDatetime(timestamp) {
        if (!timestamp) return;
        
        try {
            const timestampNum = parseInt(timestamp, 10);
            
            if (isNaN(timestampNum)) {
                updateInfoBox('Invalid timestamp format', 'warning');
                return;
            }
            
            const selectedTimezone = timezoneSelect.value;
            const datetime = dayjs.unix(timestampNum).tz(selectedTimezone);
            
            if (!datetime.isValid()) {
                updateInfoBox('Invalid timestamp value', 'warning');
                return;
            }
            
            datetimeInput.value = datetime.format(ISO_FORMAT);
            updateInfoBox(`Converted timestamp ${timestampNum} to datetime in ${selectedTimezone} timezone`, 'success');
        } catch (error) {
            updateInfoBox(`Error: ${error.message}`, 'danger');
        }
    }
    
    // Detect format from input string
    function detectFormat(datetimeStr) {
        for (const format of commonFormats) {
            if (dayjs(datetimeStr, format).isValid()) {
                return format;
            }
        }
        return null;
    }
    
    // Convert datetime to timestamp
    function datetimeToTimestamp(datetimeStr) {
        if (!datetimeStr) return;
        
        try {
            const selectedTimezone = timezoneSelect.value;
            let datetime;
            let format;
            
            // Try to auto-detect format
            format = detectFormat(datetimeStr);
            
            if (format) {
                datetime = dayjs.tz(datetimeStr, format, selectedTimezone);
            } else {
                // Try parsing as a native Date
                const nativeDate = new Date(datetimeStr);
                if (!isNaN(nativeDate.getTime())) {
                    datetime = dayjs.tz(nativeDate, selectedTimezone);
                } else {
                    updateInfoBox('Unrecognized date-time format', 'warning');
                    return;
                }
            }
            
            if (!datetime.isValid()) {
                updateInfoBox('Invalid date-time value', 'warning');
                return;
            }
            
            // Convert to Unix timestamp (seconds)
            const timestamp = datetime.unix();
            timestampInput.value = timestamp;
            
            // Format the datetime input in ISO format
            datetimeInput.value = datetime.format(ISO_FORMAT);
            
            updateInfoBox(`Converted datetime to timestamp ${timestamp} (UTC)`, 'success');
        } catch (error) {
            updateInfoBox(`Error: ${error.message}`, 'danger');
        }
    }
    
    // Event listeners
    timestampInput.addEventListener('input', function() {
        if (this.value) {
            timestampToDatetime(this.value);
        } else {
            datetimeInput.value = '';
            updateInfoBox('Enter a timestamp or a date to begin conversion');
        }
    });
    
    datetimeInput.addEventListener('input', function() {
        if (this.value) {
            datetimeToTimestamp(this.value);
        } else {
            timestampInput.value = '';
            updateInfoBox('Enter a timestamp or a date to begin conversion');
        }
    });
    
    timezoneSelect.addEventListener('change', function() {
        if (timestampInput.value) {
            timestampToDatetime(timestampInput.value);
        } else if (datetimeInput.value) {
            datetimeToTimestamp(datetimeInput.value);
        }
    });
    
    // Initialize
    initTimezoneDropdown();
    updateInfoBox('Enter a timestamp or a date to begin conversion');
    
    // Add a current time button to help users
    const cardBody = document.querySelector('.card-body');
    const buttonRow = document.createElement('div');
    buttonRow.className = 'row mb-3';
    buttonRow.innerHTML = `
        <div class="col-md-12 text-center">
            <button class="btn btn-outline-primary" id="current-time-btn">Use Current Time</button>
        </div>
    `;
    cardBody.insertBefore(buttonRow, cardBody.firstChild);
    
    document.getElementById('current-time-btn').addEventListener('click', function() {
        const now = dayjs();
        const timestamp = now.unix();
        timestampInput.value = timestamp;
        timestampToDatetime(timestamp);
    });
});