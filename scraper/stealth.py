"""
Stealth Mode Anti-Detection Patches
Comprehensive fingerprint masking and automation detection evasion
"""

import logging

logger = logging.getLogger(__name__)


async def setup_stealth_mode(page):
    """Setup comprehensive anti-detection patches"""
    logger.info("STEALTH: Setting up stealth mode...")
    
    # Core stealth patches
    await patch_webdriver_detection(page)
    await patch_navigator_properties(page)
    await patch_permissions_api(page)
    await patch_webgl_fingerprint(page)
    await patch_audio_context(page)
    await patch_media_devices(page)
    await patch_timezone_and_locale(page)
    await patch_screen_properties(page)
    await patch_chrome_runtime(page)
    await patch_iframe_detection(page)
    await patch_console_debug(page)
    
    logger.info("STEALTH: Stealth mode configured successfully")


async def patch_webdriver_detection(page):
    """Remove all WebDriver detection signatures"""
    await page.add_init_script("""
        // Remove webdriver property
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
        });
        
        // Remove automation flags
        delete window.cdc_adoQpoasnfa76pfcZLmcfl_Array;
        delete window.cdc_adoQpoasnfa76pfcZLmcfl_Promise;
        delete window.cdc_adoQpoasnfa76pfcZLmcfl_Symbol;
        
        // Remove Playwright objects
        delete window.__playwright;
        delete window.__pw_manual;
        delete window.__PW_inspect;
        
        // Remove automation variables
        window.chrome = window.chrome || {};
        Object.defineProperty(window.chrome, 'runtime', {
            value: {
                onConnect: undefined,
                onMessage: undefined,
            }
        });
        
        // Patch document.documentElement.driver
        if (document.documentElement) {
            delete document.documentElement.webdriver;
            delete document.documentElement.driver;
        }
    """)


async def patch_navigator_properties(page):
    """Patch navigator properties to look like real browser"""
    await page.add_init_script("""
        // Realistic plugins
        Object.defineProperty(navigator, 'plugins', {
            get: () => [
                {
                    0: {type: "application/x-google-chrome-pdf", suffixes: "pdf", description: "Portable Document Format", enabledPlugin: Plugin},
                    description: "Portable Document Format",
                    filename: "internal-pdf-viewer",
                    length: 1,
                    name: "Chrome PDF Plugin"
                },
                {
                    0: {type: "application/pdf", suffixes: "pdf", description: "Portable Document Format", enabledPlugin: Plugin},
                    description: "Portable Document Format", 
                    filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
                    length: 1,
                    name: "Chrome PDF Viewer"
                },
                {
                    0: {type: "application/x-nacl", suffixes: "", description: "Native Client Executable", enabledPlugin: Plugin},
                    1: {type: "application/x-pnacl", suffixes: "", description: "Portable Native Client Executable", enabledPlugin: Plugin},
                    description: "Native Client",
                    filename: "internal-nacl-plugin",
                    length: 2,
                    name: "Native Client"
                }
            ]
        });
        
        // Realistic mimeTypes
        Object.defineProperty(navigator, 'mimeTypes', {
            get: () => [
                {type: "application/pdf", suffixes: "pdf", description: "Portable Document Format", enabledPlugin: Plugin},
                {type: "application/x-google-chrome-pdf", suffixes: "pdf", description: "Portable Document Format", enabledPlugin: Plugin},
                {type: "application/x-nacl", suffixes: "", description: "Native Client Executable", enabledPlugin: Plugin},
                {type: "application/x-pnacl", suffixes: "", description: "Portable Native Client Executable", enabledPlugin: Plugin}
            ]
        });
        
        // Hardware concurrency 
        Object.defineProperty(navigator, 'hardwareConcurrency', {
            get: () => 8
        });
        
        // Languages
        Object.defineProperty(navigator, 'languages', {
            get: () => ['en-US', 'en', 'fr', 'ar']
        });
        
        // Platform
        Object.defineProperty(navigator, 'platform', {
            get: () => 'Win32'
        });
        
        // Device memory
        Object.defineProperty(navigator, 'deviceMemory', {
            get: () => 8
        });
        
        // Connection
        Object.defineProperty(navigator, 'connection', {
            get: () => ({
                effectiveType: '4g',
                downlink: 10,
                rtt: 50
            })
        });
    """)


async def patch_permissions_api(page):
    """Patch permissions API to return realistic values"""
    await page.add_init_script("""
        // Notification permission
        Object.defineProperty(Notification, 'permission', {
            get: () => 'default'
        });
        
        // Permissions query
        const originalQuery = navigator.permissions.query;
        navigator.permissions.query = (parameters) => {
            const permission = parameters.name;
            
            if (permission === 'notifications') {
                return Promise.resolve({state: 'default'});
            } else if (permission === 'geolocation') {
                return Promise.resolve({state: 'prompt'});
            } else if (permission === 'camera') {
                return Promise.resolve({state: 'prompt'});
            } else if (permission === 'microphone') {
                return Promise.resolve({state: 'prompt'});
            }
            
            return originalQuery(parameters);
        };
    """)


async def patch_webgl_fingerprint(page):
    """Patch WebGL to return realistic GPU information"""
    await page.add_init_script("""
        const getParameter = WebGLRenderingContext.prototype.getParameter;
        WebGLRenderingContext.prototype.getParameter = function(parameter) {
            // Fake a realistic GPU
            if (parameter === 37445) {
                return 'Intel Inc.';
            }
            if (parameter === 37446) {
                return 'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11-27.20.100.8280)';
            }
            return getParameter(parameter);
        };
        
        const getParameter2 = WebGL2RenderingContext.prototype.getParameter;
        WebGL2RenderingContext.prototype.getParameter = function(parameter) {
            // Fake a realistic GPU
            if (parameter === 37445) {
                return 'Intel Inc.';
            }
            if (parameter === 37446) {
                return 'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11-27.20.100.8280)';
            }
            return getParameter2(parameter);
        };
    """)


async def patch_audio_context(page):
    """Patch AudioContext fingerprinting"""
    await page.add_init_script("""
        const audioContext = AudioContext.prototype.createAnalyser;
        AudioContext.prototype.createAnalyser = function() {
            const analyser = audioContext.call(this);
            const originalGetFloatFrequencyData = analyser.getFloatFrequencyData;
            analyser.getFloatFrequencyData = function(array) {
                originalGetFloatFrequencyData.call(this, array);
                // Add small amount of noise to prevent fingerprinting
                for (let i = 0; i < array.length; i++) {
                    array[i] += Math.random() * 0.0001;
                }
            };
            return analyser;
        };
    """)


async def patch_media_devices(page):
    """Patch mediaDevices to prevent WebRTC leaks"""
    await page.add_init_script("""
        // Mock media devices
        Object.defineProperty(navigator, 'mediaDevices', {
            get: () => ({
                enumerateDevices: () => Promise.resolve([
                    {
                        deviceId: 'default',
                        kind: 'audioinput',
                        label: 'Default - Microphone Array (Intel Smart Sound Technology for USB Audio)',
                        groupId: 'group1'
                    },
                    {
                        deviceId: 'default',
                        kind: 'audiooutput', 
                        label: 'Default - Speakers (Intel Smart Sound Technology for USB Audio)',
                        groupId: 'group1'
                    },
                    {
                        deviceId: 'default',
                        kind: 'videoinput',
                        label: 'Integrated Camera',
                        groupId: 'group2'
                    }
                ]),
                getUserMedia: () => Promise.reject(new Error('Permission denied')),
                getDisplayMedia: () => Promise.reject(new Error('Permission denied'))
            })
        });
        
        // Block WebRTC
        const origRTCPeerConnection = window.RTCPeerConnection;
        window.RTCPeerConnection = function(...args) {
            const pc = new origRTCPeerConnection(...args);
            
            const origCreateDataChannel = pc.createDataChannel;
            pc.createDataChannel = function() {
                return origCreateDataChannel.apply(pc, arguments);
            };
            
            return pc;
        };
    """)


async def patch_timezone_and_locale(page):
    """Patch timezone and locale information"""
    await page.add_init_script("""
        // Timezone
        Object.defineProperty(Intl.DateTimeFormat.prototype, 'resolvedOptions', {
            value: function() {
                return {
                    locale: 'en-US',
                    timeZone: 'Africa/Casablanca',
                    calendar: 'gregory',
                    numberingSystem: 'latn'
                };
            }
        });
        
        // Date timezone
        Date.prototype.getTimezoneOffset = function() {
            return -60; // UTC+1 (Morocco Standard Time)
        };
    """)


async def patch_screen_properties(page):
    """Patch screen properties to be realistic"""
    await page.add_init_script("""
        Object.defineProperty(screen, 'width', {
            get: () => 1920
        });
        Object.defineProperty(screen, 'height', {
            get: () => 1080
        });
        Object.defineProperty(screen, 'availWidth', {
            get: () => 1920
        });
        Object.defineProperty(screen, 'availHeight', {
            get: () => 1040
        });
        Object.defineProperty(screen, 'colorDepth', {
            get: () => 24
        });
        Object.defineProperty(screen, 'pixelDepth', {
            get: () => 24
        });
    """)


async def patch_chrome_runtime(page):
    """Patch Chrome runtime to appear more realistic"""
    await page.add_init_script("""
        // Chrome runtime
        window.chrome = window.chrome || {};
        window.chrome.runtime = window.chrome.runtime || {};
        
        Object.defineProperty(window.chrome.runtime, 'onConnect', {
            value: {
                addListener: () => {},
                removeListener: () => {},
                hasListener: () => false
            }
        });
        
        Object.defineProperty(window.chrome.runtime, 'onMessage', {
            value: {
                addListener: () => {},
                removeListener: () => {},
                hasListener: () => false
            }
        });
    """)


async def patch_iframe_detection(page):
    """Patch iframe detection methods"""
    await page.add_init_script("""
        // Make sure we don't appear to be in an iframe
        Object.defineProperty(window, 'top', {
            get: () => window
        });
        
        Object.defineProperty(window, 'parent', {
            get: () => window
        });
        
        Object.defineProperty(window, 'frameElement', {
            get: () => null
        });
    """)


async def patch_console_debug(page):
    """Patch console to avoid debug detection"""
    await page.add_init_script("""
        // Save original console methods
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        
        // Override console methods to appear normal
        console.log = function() {
            return originalLog.apply(console, arguments);
        };
        
        console.error = function() {
            return originalError.apply(console, arguments);
        };
        
        console.warn = function() {
            return originalWarn.apply(console, arguments);
        };
        
        // Hide debug info
        console.debug = () => {};
        console.trace = () => {};
        console.profile = () => {};
        console.profileEnd = () => {};
        
        // Image onload patch to prevent detection
        const originalImageSrc = Object.getOwnPropertyDescriptor(Image.prototype, 'src');
        Object.defineProperty(Image.prototype, 'src', {
            get: originalImageSrc.get,
            set: function(value) {
                // Prevent detection through image loading
                return originalImageSrc.set.call(this, value);
            }
        });
    """)