const express = require('express');
const fetch = require('node-fetch');
const path = require('path'); // Import the path module


const app = express();
const port = 2000;

app.use(express.json());

//app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


// Route to handle fetching weather data
app.post('/weather', async (req, res) => {
    try {
        const zipCode = req.body.zipCode.trim();
        
        // logs to terminal an error if user inputs a non-5 digit zipcode
        if (!/^\d{5}$/.test(zipCode)) {
            console.log("Enter a 5 digit Zip");
        }
        
        // logs the input zipcode
        console.log(`The input zipcode is: ${zipCode}`)

        // fetching into geocoding API with zipCode as the input. Purpose is to retrieve coordinates that belongs to the zipcode
        const coordResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${zipCode}&count=10`);
                                    // waits for the response from the fetch before moving to next code

        if (!coordResponse.ok) {
            throw new Error("Can't Fetch Zipcode. Status: 400");
        }
        
        // reads the JSON response from the fetch to extract the coordinates which will be stored in zipCodeData
        const zipCodeData = await coordResponse.json();

        //console.log(zipCodeData)

        // checks for valid zipcode within the API
        if (!zipCodeData.results) { //accessing property "results" from the APIs JSON response

            // if zipcode does not exist in API, throws error
            throw new Error("Zipcode does not exist in the API. Try a different Zipcode.");
        }

        const weatherDataArray = [];

        // old code, ignore
        //const weatherElement = document.getElementById("weatherData");
        // weatherElement.innerHTML = "";

        // Loop through the JSON's "results:" array for each location name with the same zipcode
        for (const result of zipCodeData.results) {

            // for each location/name from the JSON response, access and extracts the properties and it's values
            const { latitude, longitude, name, admin1, country, country_code } = result;

            const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,is_day,wind_speed_10m,wind_direction_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`);

            if (!weatherResponse.ok) {
                throw new Error("Can't Fetch API. Status: 400");
            }

            const weatherData = await weatherResponse.json();

            // decontructing assignments. Concise way to create variables and assign them to the same name of the value from the property
            const { temperature_2m, wind_speed_10m, wind_direction_10m, is_day } = weatherData.current;
            const { temperature_2m: tempFah, wind_speed_10m: windSpeedMph, wind_direction_10m: windDirectionDegree } = weatherData.current_units;
           
           // to only result locations inside the US since the API results in locations outside US with certain zipcodes
           if (country_code === "US") {
               console.log("Current weather in", name+ ",", admin1+",", country, "is", temperature_2m + tempFah, "with wind speeds of", wind_speed_10m + windSpeedMph, "towards", wind_direction_10m + windDirectionDegree + ". Currently it is", is_day ? "Day" : "Night" , "time.");
            }

            weatherDataArray.push({
                name,
                admin1,
                country,
                country_code,
                temperature: temperature_2m + tempFah,
                wind_speed: wind_speed_10m + windSpeedMph,
                wind_direction: wind_direction_10m + windDirectionDegree,
                is_day: is_day ? "Day" : "Night"
            });

            // old code, ignore
           // weatherElement.innerHTML += 
                //`<p>Current Weather in ${name}, ${admin1}, ${country}:</p>
               // <p>Temperature: ${temperature_2m}${tempFah}</p>
               // <p>Wind Speed: ${wind_speed_10m}${windSpeedMph} at ${wind_direction_10m}${DegreeSymbol}</p>
               // <p>Currently Day or Night: ${dayorNight}</p>
               // <hr>`

            //console.log("Current weather in", name+ ",", admin1+",", country, "is", temperature_2m + tempFah, "with wind speeds of", wind_speed_10m + windSpeedMph, "towards", wind_direction_10m + windDirectionDegree + ". Currently it is", is_day ? "Day" : "Night" , "time.");

        }

        res.json(weatherDataArray);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server is listening at http://localhost:${port}`);
});
