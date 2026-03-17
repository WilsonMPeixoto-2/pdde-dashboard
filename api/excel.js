const https = require('https');
const xlsx = require('xlsx');

// This Serverless Function runs on Vercel backend to bypass CORS and parse the Excel file secretly.
module.exports = async (req, res) => {
    // URL compartilhada configurada para guest download direto
    const fileUrl = 'https://rioeduca-my.sharepoint.com/personal/wilson_mpeixoto_rioeduca_net/_layouts/15/download.aspx?share=IQBfthSt4_rrSrPUrxqxwDY7AfUSuaRqf_03-JACEivzpkQ';
    
    try {
        const buffer = await downloadFile(fileUrl);
        
        // Parse the Excel buffer
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to array-of-arrays (positional, avoids duplicate header name issues)
        const rawJson = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        
        if (rawJson.length <= 1) {
            return res.status(500).json({ error: 'Planilha lida, mas vazia ou não é um arquivo .xlsx válido.' });
        }

        // Send header row separately, data rows starting from index 1
        return res.status(200).json({ 
            success: true, 
            message: 'Dados extraídos com sucesso.',
            headers: rawJson[0],
            data: rawJson.slice(1) // Skip header row
        });

    } catch (error) {
        console.error('Error fetching/parsing Excel:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message,
            hint: 'A Microsoft bloqueou o download anônimo. Certifique-se de que o link do OneDrive está como "Qualquer pessoa com o link pode editar/visualizar".' 
        });
    }
};

function downloadFile(url) {
    return new Promise((resolve, reject) => {
        const fetchUrl = (currentUrl, redirects = 0) => {
            if (redirects > 5) return reject(new Error('Muitos redirecionamentos'));
            
            https.get(currentUrl, (response) => {
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    // Follow redirect
                    let redirectUrl = response.headers.location;
                    if (!redirectUrl.startsWith('http')) {
                        const parsedUrl = new URL(currentUrl);
                        redirectUrl = `${parsedUrl.origin}${redirectUrl}`;
                    }
                    return fetchUrl(redirectUrl, redirects + 1);
                }
                
                if (response.statusCode !== 200) {
                    return reject(new Error(`Falha no download. HTTP Status: ${response.statusCode}. Isso geralmente indica que a planilha não está pública na conta corporativa (Exige Login).`));
                }

                // Check content type to see if we got an HTML login page instead of excel
                const contentType = response.headers['content-type'] || '';
                if (contentType.includes('text/html')) {
                    return reject(new Error('A Microsoft retornou uma página de Login (SSO). O link compartilhado não é público (anônimo).'));
                }

                const chunks = [];
                response.on('data', chunk => chunks.push(chunk));
                response.on('end', () => resolve(Buffer.concat(chunks)));
            }).on('error', reject);
        };
        fetchUrl(url);
    });
}
