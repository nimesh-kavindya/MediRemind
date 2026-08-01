const fileToBase64 = (fileBlob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(fileBlob);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

export const analyzePrescription = async (imageFile) => {
  try {
    let imageBase64 = null;
    let mimeType = 'image/jpeg';

    if (imageFile instanceof Blob || imageFile instanceof File) {
      imageBase64 = await fileToBase64(imageFile);
      mimeType = imageFile.type || 'image/jpeg';
    }

    const response = await fetch('/api/analyze-prescription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        mimeType,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to analyze prescription');
    }

    const parsedData = await response.json();
    
    // Map to our internal schema
    return (parsedData || []).map(med => ({
      id: `gemini_${Math.random().toString(36).substr(2, 9)}`,
      name: med.name || 'Unknown Medicine',
      dosage: med.dosage || med.strength || '1 pill',
      type: med.type || 'pill',
      frequency: med.frequency || 'Daily',
      mealTiming: typeof med.mealTiming === 'string' && med.mealTiming.toLowerCase().includes('before') ? 'before_meal' : 
                  typeof med.mealTiming === 'string' && med.mealTiming.toLowerCase().includes('after') ? 'after_meal' : 'anytime',
      reminderTime: med.times && med.times.length > 0 ? med.times[0] : '08:00',
      confidence: 99,
      selected: true,
      notes: med.notes || (med.strength ? `Strength: ${med.strength}. Duration: ${med.duration || 'N/A'}` : '')
    }));

  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error(error.message || 'Failed to analyze prescription using AI.');
  }
};
