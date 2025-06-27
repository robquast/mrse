function setSchedule(schedule) {
    document.getElementById('notificationSchedule').value = schedule;
}

document.getElementById('preferencesForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const preferences = {
        notificationEnabled: document.getElementById('notificationEnabled').checked,
        notificationSchedule: document.getElementById('notificationSchedule').value,
        advanceNoticeHours: parseInt(document.getElementById('advanceNoticeHours').value),
        includeInternalMeetings: document.getElementById('includeInternalMeetings').checked,
        includeExternalMeetings: document.getElementById('includeExternalMeetings').checked
    };
    
    try {
        const response = await fetch('/api/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(preferences)
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Preferences saved successfully!');
        } else {
            alert('Failed to save preferences. Please try again.');
        }
    } catch (error) {
        alert('An error occurred while saving preferences.');
        console.error('Save error:', error);
    }
});