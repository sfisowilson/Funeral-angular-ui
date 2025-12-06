const fs = require('fs');
const axios = require('axios');
const https = require('https'); // For handling HTTPS requests
const { exec } = require('child_process');

// Configuration
const SWAGGER_URL = 'https://localhost:44375/swagger/v1/swagger.json'; // Replace with your Swagger URL
const OUTPUT_DIR = 'C:/Projects/Funeral/Frontend/src/app/core/services/service-proxies.ts'; // Output directory for Angular services
const SWAGGER_FILE = './swagger.json'; // Temporary file to store Swagger JSON
const NSWAH_CONFIG = './nswag.json'; // NSwag configuration file

// Step 1: Fetch Swagger JSON
async function fetchSwaggerJson() {
    try {
        console.log('Fetching Swagger JSON...');
        const response = await axios.get(SWAGGER_URL, {
            httpsAgent: new https.Agent({
                rejectUnauthorized: false // Ignore self-signed certificate errors
            })
        });
        fs.writeFileSync(SWAGGER_FILE, JSON.stringify(response.data, null, 2));
        console.log(`Swagger JSON saved to ${SWAGGER_FILE}`);
    } catch (error) {
        console.error('Failed to fetch Swagger JSON:', error.message);
        process.exit(1);
    }
}

// Step 2: Generate Angular services using NSwag
function generateAngularServices() {
    console.log('Generating Angular services...');
    exec(`nswag run ${NSWAH_CONFIG}`, (error, stdout, stderr) => {
        if (error) {
            console.error('Failed to generate Angular services:', error.message);
            console.error('NSwag stderr:', stderr);
            cleanup(); // Clean up on error
            process.exit(1);
        }
        console.log(stdout);
        console.log('Angular services generated successfully!');
        deleteLastLine(OUTPUT_DIR);
        cleanup(); // Clean up on success
    });
}

// Step 3: Delete the last line of a file
function deleteLastLine(filePath) {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return;
        }
        const lines = data.split('\n');
        if (lines.length > 0) {
            lines.pop(); // Remove the last line
            const newContent = lines.join('\n');
            fs.writeFile(filePath, newContent, 'utf8', (err) => {
                if (err) {
                    console.error('Error writing file:', err);
                } else {
                    console.log(`Last line deleted from ${filePath}`);
                }
            });
        }
    });
}

// Step 4: Clean up temporary files
function cleanup() {
    if (fs.existsSync(SWAGGER_FILE)) {
        fs.unlinkSync(SWAGGER_FILE);
        console.log(`Temporary file ${SWAGGER_FILE} deleted.`);
    }
}

// Main function
async function main() {
    try {
        console.log('Starting script...');
        await fetchSwaggerJson();
        generateAngularServices();
    } catch (error) {
        console.error('Unhandled error in script:', error);
        cleanup(); // Clean up on error
    }
}

// Run the script
main();
