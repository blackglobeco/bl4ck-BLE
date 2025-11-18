'use strict';

let theServer = null;
let theDevice = null;
let deviceInfoServiceUudi = '0000180a-0000-1000-8000-00805f9b34fb';
let writableCharacteristics = [];

function onConnected(device) {
    console.log("BLE connected, preparing dashboard...");
    
    // Populate device info (but don't show dashboard yet)
    document.querySelector('#deviceName').textContent = device.name || 'Unknown Device';
    document.querySelector('#deviceId').textContent = device.id;
    document.querySelector('#deviceConnected').innerHTML = '<span style="color: #4CAF50;">Yes</span>';
}

function onDisconnected() {
    console.log("BLE disconnected");
    
    // Hide dashboard and reset
    document.querySelector('#dashboard').classList.add('hidden');
    document.querySelector('#deviceConnected').innerHTML = '<span style="color: #f44336;">No</span>';
    document.querySelector('#servicesContainer').innerHTML = '';
    
    theServer = null;
    theDevice = null;
    
    // Reopen the connection dialog
    const dialogElement = document.querySelector('dialog');
    if (dialogElement) {
        dialogElement.showModal();
    }
    
    // Show notification
    var notification = document.querySelector('.mdl-js-snackbar');
    notification.MaterialSnackbar.showSnackbar(
        {
            message: 'Device disconnected',
            timeout: 2000
        }
    );
}

function connect() {

    document.querySelector('.connect-button').setAttribute("disabled","");
    document.querySelector('#progressbar').classList.remove('hidden');

    // Validate services UUID entered by user first.
    let optionalServices = document.querySelector('#optionalServices').value
    .split(/, ?/).map(s => s.startsWith('0x') ? parseInt(s) : s)
    .filter(s => s && BluetoothUUID.getService);

    navigator.bluetooth.requestDevice(
    {
        acceptAllDevices: true, optionalServices: optionalServices
    })
    .then(device => {
        theDevice = device;
        console.log('> Found ' + device.name);
        console.log('Connecting to GATT Server...');
        device.addEventListener('gattserverdisconnected', onDisconnected)
        return device.gatt.connect();
    })
    .then(server => {
        theServer = server;
        console.log('Gatt connected');
        onConnected(theDevice);

        console.log('Getting Services...');
        return server.getPrimaryServices();
    })
    .then(services => {
        console.log('Getting Characteristics...');
        const servicesContainer = document.querySelector('#servicesContainer');
        servicesContainer.innerHTML = '';
        
        let queue = Promise.resolve();
        services.forEach(service => {
          queue = queue.then(_ => service.getCharacteristics().then(characteristics => {
            console.log('> Service: ' + service.uuid);
            
            // Create service card in dashboard
            const serviceCard = document.createElement('div');
            serviceCard.className = 'service-card';
            serviceCard.innerHTML = `
              <h4 class="service-title">Service: ${getServiceName(service.uuid)}</h4>
              <div class="service-uuid">${service.uuid}</div>
              <div class="characteristics-list"></div>
            `;
            
            const charList = serviceCard.querySelector('.characteristics-list');
            characteristics.forEach(characteristic => {
                console.log('>> Characteristic: ' + characteristic.uuid + ' ' +
                  getSupportedProperties(characteristic));
                
                const charItem = document.createElement('div');
                charItem.className = 'characteristic-item';
                charItem.innerHTML = `
                  <div class="char-uuid">${characteristic.uuid}</div>
                  <div class="char-properties">${getSupportedProperties(characteristic)}</div>
                `;
                charList.appendChild(charItem);
                
                // Track writable characteristics
                if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
                    writableCharacteristics.push({
                        uuid: characteristic.uuid,
                        service: service.uuid,
                        characteristic: characteristic,
                        name: getCharacteristicName(characteristic.uuid)
                    });
                }
            });
            
            servicesContainer.appendChild(serviceCard);
          }));
        });
        return queue;
    })
    .then(() => {
        console.log('All services and characteristics loaded successfully');
        
        // Populate writable characteristics dropdown
        const charSelect = document.querySelector('#targetCharacteristic');
        charSelect.innerHTML = '<option value="">Select writable characteristic...</option>';
        writableCharacteristics.forEach((char, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${char.name} (${char.uuid})`;
            charSelect.appendChild(option);
        });
        
        // NOW show the dashboard after everything is loaded
        document.querySelector('#dashboard').classList.remove('hidden');
        document.querySelector('#progressbar').classList.add('hidden');
        document.querySelector('.connect-button').removeAttribute("disabled");
        
        // Close the connection dialog
        const dialogElement = document.querySelector('dialog');
        if (dialogElement) {
            dialogElement.close();
        }
        
        var notification = document.querySelector('.mdl-js-snackbar');
        notification.MaterialSnackbar.showSnackbar(
            {
                message: 'Device connected and services loaded!',
                timeout: 2000
            }
        );
    })
    .catch(error => {
        console.log('Argh! ' + error);
        document.querySelector('#progressbar').classList.add('hidden');
        document.querySelector('.connect-button').removeAttribute("disabled");
        var notification = document.querySelector('.mdl-js-snackbar');
        notification.MaterialSnackbar.showSnackbar(
            {
                message: 'Error while connecting to BLE, please try again.'
            }
        );
    });
}

function getSupportedProperties(characteristic) {
    let supportedProperties = [];
    for (const p in characteristic.properties) {
      if (characteristic.properties[p] === true) {
        supportedProperties.push(p.toUpperCase());
      }
    }
    return '[' + supportedProperties.join(', ') + ']';
}

function getServiceName(uuid) {
    const serviceNames = {
        '0000180a-0000-1000-8000-00805f9b34fb': 'Device Information',
        '0000180f-0000-1000-8000-00805f9b34fb': 'Battery Service',
        '00001800-0000-1000-8000-00805f9b34fb': 'Generic Access',
        '00001801-0000-1000-8000-00805f9b34fb': 'Generic Attribute',
        '00001802-0000-1000-8000-00805f9b34fb': 'Immediate Alert',
        '00001803-0000-1000-8000-00805f9b34fb': 'Link Loss',
        '00001804-0000-1000-8000-00805f9b34fb': 'Tx Power',
        '00001805-0000-1000-8000-00805f9b34fb': 'Current Time',
        '00001806-0000-1000-8000-00805f9b34fb': 'Reference Time Update',
        '00001808-0000-1000-8000-00805f9b34fb': 'Glucose',
        '00001809-0000-1000-8000-00805f9b34fb': 'Health Thermometer',
        '0000180d-0000-1000-8000-00805f9b34fb': 'Heart Rate',
        '0000181c-0000-1000-8000-00805f9b34fb': 'User Data',
        '0000181d-0000-1000-8000-00805f9b34fb': 'Weight Scale'
    };
    return serviceNames[uuid] || 'Unknown Service';
}

function getCharacteristicName(uuid) {
    const charNames = {
        '00002a00-0000-1000-8000-00805f9b34fb': 'Device Name',
        '00002a01-0000-1000-8000-00805f9b34fb': 'Appearance',
        '00002a19-0000-1000-8000-00805f9b34fb': 'Battery Level',
        '00002a29-0000-1000-8000-00805f9b34fb': 'Manufacturer Name',
        '00002a4d-0000-1000-8000-00805f9b34fb': 'HID Report'
    };
    return charNames[uuid] || 'Custom Characteristic';
}

// Process DuckyScript-style commands to byte arrays
function processPayloadCommand(command) {
    const encoder = new TextEncoder();
    command = command.trim();
    
    if (command.startsWith('STRING ')) {
        // Send text as UTF-8 bytes
        return encoder.encode(command.substring(7));
    } else if (command === 'ENTER') {
        return new Uint8Array([0x0D]); // Carriage return
    } else if (command.startsWith('DELAY ')) {
        return { type: 'delay', ms: parseInt(command.substring(6)) };
    } else if (command.startsWith('HEX ')) {
        // Send raw hex bytes
        const hexStr = command.substring(4).replace(/\s/g, '');
        const bytes = [];
        for (let i = 0; i < hexStr.length; i += 2) {
            bytes.push(parseInt(hexStr.substr(i, 2), 16));
        }
        return new Uint8Array(bytes);
    } else {
        // Send raw text
        return encoder.encode(command);
    }
}

async function sendPayload() {
    const charIndex = document.querySelector('#targetCharacteristic').value;
    const payload = document.querySelector('#payloadInput').value;
    const statusDiv = document.querySelector('#payloadStatus');
    const statusText = document.querySelector('#payloadStatusText');
    
    if (!charIndex || charIndex === '') {
        alert('Please select a writable characteristic first');
        return;
    }
    
    if (!payload.trim()) {
        alert('Please enter a payload');
        return;
    }
    
    const targetChar = writableCharacteristics[parseInt(charIndex)];
    const commands = payload.split('\n').filter(cmd => cmd.trim() && !cmd.trim().startsWith('REM'));
    
    statusDiv.style.display = 'block';
    statusText.innerHTML = 'Sending payload...<br>';
    
    try {
        for (let i = 0; i < commands.length; i++) {
            const cmd = commands[i];
            const data = processPayloadCommand(cmd);
            
            statusText.innerHTML += `[${i+1}/${commands.length}] ${cmd}<br>`;
            
            if (data && data.type === 'delay') {
                await new Promise(resolve => setTimeout(resolve, data.ms));
            } else if (data && data.length > 0) {
                await targetChar.characteristic.writeValue(data);
                await new Promise(resolve => setTimeout(resolve, 50)); // Small delay between writes
            }
        }
        
        statusText.innerHTML += '<span style="color: #4CAF50;">✓ Payload sent successfully!</span>';
        
        var notification = document.querySelector('.mdl-js-snackbar');
        notification.MaterialSnackbar.showSnackbar({
            message: 'Payload sent successfully!',
            timeout: 2000
        });
        
    } catch (error) {
        statusText.innerHTML += `<span style="color: #f44336;">✗ Error: ${error.message}</span>`;
        console.error('Payload send error:', error);
    }
}

// Add disconnect button listener
document.addEventListener('DOMContentLoaded', function() {
    const disconnectButton = document.querySelector('.disconnect-button');
    if (disconnectButton) {
        disconnectButton.addEventListener('click', function() {
            if (theServer && theServer.connected) {
                theServer.disconnect();
            }
        });
    }
    
    const sendButton = document.querySelector('#sendPayloadBtn');
    if (sendButton) {
        sendButton.addEventListener('click', sendPayload);
    }
});
