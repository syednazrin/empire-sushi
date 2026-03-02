// Test script to verify district data loads correctly
const testDistrictData = async () => {
  try {
    const response = await fetch('http://localhost:3000/District%20Dosm%20Data/json%20files/simplified_district_data.json');
    const data = await response.json();
    
    console.log('✓ District data loaded successfully');
    console.log('  - Total rows:', data.state.length);
    console.log('  - Unique states:', new Set(data.state).size);
    console.log('  - Unique districts:', new Set(data.district).size);
    console.log('  - Date range:', [...new Set(data.date)].sort());
    console.log('  - Sample district:', data.district[0]);
    console.log('  - Sample population:', data.population[0], 'k');
    
    return true;
  } catch (error) {
    console.error('✗ Error loading district data:', error);
    return false;
  }
};

// Run test
testDistrictData();
