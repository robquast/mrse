async function syncCalendar() {
    const button = event.target;
    button.disabled = true;
    button.textContent = 'Syncing...';
    
    try {
        const response = await fetch('/dashboard/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(`Successfully synced ${data.eventsCount} events`);
            window.location.reload();
        } else {
            alert('Sync failed. Please try again.');
        }
    } catch (error) {
        alert('An error occurred during sync.');
        console.error('Sync error:', error);
    } finally {
        button.disabled = false;
        button.textContent = 'Sync Calendar Now';
    }
}