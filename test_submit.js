async function testSubmit() {
    try {
        const response = await fetch('http://localhost:3000/api/complaints', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                citizenName: 'Test John',
                contactInfo: 'john@example.com',
                category: 'Electricity',
                description: 'Power cut in my street',
                department: 'Electricity Department',
                priority: 'High'
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Complaint submitted successfully:', data);
        } else {
            console.error('Failed to submit complaint:', response.status, await response.text());
        }
    } catch (err) {
        console.error('Error connecting to server:', err.message);
    }
}

testSubmit();
