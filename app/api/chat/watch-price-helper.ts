// Helper function to query ctime.com for watch price data
export async function queryCtimePrice(serial: string): Promise<{
    price?: number;
    found: boolean;
}> {
    try {
        if (!serial || serial.trim() === '') {
            return { found: false };
        }

        const response = await fetch(
            `https://www.ctime.com/index.php/watch/detailSerial?serial=${encodeURIComponent(serial.trim())}`,
            {
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) {
            console.error(`Ctime API error: ${response.status}`);
            return { found: false };
        }

        const data = await response.json();

        // Check if we got valid result with price > 0
        if (data && data.code === 1 && data.cnPrice && data.cnPrice > 0) {
            return {
                price: data.cnPrice,
                found: true
            };
        }

        return { found: false };
    } catch (error) {
        console.error("Error querying ctime API:", error);
        return { found: false };
    }
}

// Helper function to query thewatchapi.com for watch price data (deprecated)
export async function queryWatchPrice(brandName: string, modelName: string): Promise<{
    price?: string;
    found: boolean;
}> {
    try {
        const apiToken = process.env.WATCH_API_TOKEN;
        if (!apiToken) {
            console.warn("WATCH_API_TOKEN not configured");
            return { found: false };
        }

        // Clean brand and model names for API query
        const cleanBrand = brandName.split(' ')[0]; // Get first word (usually English name)
        const cleanModel = modelName.replace(/[^\w\s]/g, '').trim();

        // Search for watches by brand
        const searchUrl = `https://api.thewatchapi.com/watches?brand=${encodeURIComponent(cleanBrand)}&model=${encodeURIComponent(cleanModel)}`;

        const response = await fetch(searchUrl, {
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`Watch API error: ${response.status}`);
            return { found: false };
        }

        const data = await response.json();

        // Check if we got results
        if (data && data.data && data.data.length > 0) {
            const watch = data.data[0];

            // Extract price if available
            if (watch.price_min && watch.price_max) {
                const priceMin = Math.round(watch.price_min);
                const priceMax = Math.round(watch.price_max);
                return {
                    price: `¥${priceMin.toLocaleString('zh-CN')} - ¥${priceMax.toLocaleString('zh-CN')}`,
                    found: true
                };
            } else if (watch.price) {
                const price = Math.round(watch.price);
                return {
                    price: `约 ¥${price.toLocaleString('zh-CN')}`,
                    found: true
                };
            }
        }

        return { found: false };
    } catch (error) {
        console.error("Error querying watch API:", error);
        return { found: false };
    }
}
