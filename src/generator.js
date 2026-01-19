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
    return new Promise((resolve, reject) => {
        console.log('Generating Angular services...');
        exec(`nswag run ${NSWAH_CONFIG}`, { cwd: __dirname }, (error, stdout, stderr) => {
            if (error) {
                console.error('Failed to generate Angular services:', error.message);
                if (stderr) console.error('NSwag stderr:', stderr);
                reject(error);
                return;
            }
            console.log(stdout);
            console.log('Angular services generated successfully!');
            // unwrapAllResponses(OUTPUT_DIR);
            // fixObservableReturnTypes(OUTPUT_DIR);
            resolve();
        });
    });
}

// Step 3b: Process SwaggerResponse wrapped results
function unwrapAllResponses(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Remove all new SwaggerResponse(...) constructor calls - replace with just returning the result
        // Pattern: new SwaggerResponse(status, _headers, VALUE)
        content = content.replace(/new SwaggerResponse\(status, _headers, ([^)]+)\)/g, '$1');
        
        // Unwrap the SwaggerResponse type wrappers - just use the inner type
        content = content.replace(/Observable<SwaggerResponse<([^>]+)>>/g, 'Observable<$1>');
        content = content.replace(/_observableOf<SwaggerResponse<([^>]+)>>/g, '_observableOf<$1>');
        
        // Fix fallback return statements: match method signatures to their return statements
        // Split into lines to process context
        const lines = content.split('\n');
        let result = [];
        let methodReturnType = null;
        let methodName = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Detect protected process method signatures to track their return types
            // Pattern: protected processXXX(...): Observable<TypeX[]> {
            const methodMatch = line.match(/protected\s+(\w+)\([^)]*\):\s*Observable<([^>]+)>/);
            if (methodMatch) {
                methodName = methodMatch[1];
                methodReturnType = methodMatch[2];
            }
            
            // Fix fallback return statements that don't match the method's return type
            // Look for "return _observableOf<X>(null as any);" statements
            if (line.includes('return _observableOf<') && line.includes('>(null as any);')) {
                const returnMatch = line.match(/return _observableOf<([^>]+)>\(null as any\);/);
                if (returnMatch && methodReturnType) {
                    const currentType = returnMatch[1];
                    // If method returns an array type but the return statement doesn't have it, add it
                    if (methodReturnType.includes('[]') && !currentType.includes('[]')) {
                        const correctedLine = line.replace(
                            /return _observableOf<([^>]+)>\(null as any\);/,
                            `return _observableOf([] as any as ${methodReturnType});`
                        );
                        result.push(correctedLine);
                        continue;
                    }
                    // If method returns a single type but the return statement has array brackets, remove them
                    else if (!methodReturnType.includes('[]') && currentType.includes('[]')) {
                        const baseType = currentType.replace('[]', '');
                        const correctedLine = line.replace(
                            /return _observableOf<([^>]+)>\(null as any\);/,
                            `return _observableOf(null as any as ${baseType});`
                        );
                        result.push(correctedLine);
                        continue;
                    }
                }
            }
            
            result.push(line);
        }
        
        content = result.join('\n');
        fs.writeFileSync(filePath, content + '\n', 'utf8');
        console.log('✓ SwaggerResponse wrappers processed');
    } catch (error) {
        console.error('Error processing responses:', error.message);
    }
}

// Step 3c: Fix RxJS of() type inference issues with fallback returns
function fixObservableReturnTypes(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace all remaining _observableOf<Type>(null as any) patterns
        // The issue is that RxJS of() with null as any doesn't infer generic types correctly
        // Solution: Use direct casting pattern instead
        content = content.replace(
            /return _observableOf<([^>]+)>\(null as any\);/g,
            (match, type) => {
                return `return (null as any) as Observable<${type}>;`;
            }
        );
        
        fs.writeFileSync(filePath, content + '\n', 'utf8');
        console.log('✓ Observable return types fixed');
    } catch (error) {
        console.error('Error fixing observable types:', error.message);
    }
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
        await generateAngularServices();
        console.log('✓ Service proxies generated and processed successfully');
        process.exit(0);
    } catch (error) {
        console.error('✗ Error:', error.message);
        process.exit(1);
    }
}

// Run the script
main();
