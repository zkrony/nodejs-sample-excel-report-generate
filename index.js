const mysql = require('mysql2');
const XLSX = require('xlsx');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

// MySQL Database Connection

// Database = osud_potro_prod_db
// DBUsername = opl_prod_db_user_new
// DBPassword = %(kV)K3zE}23Vrtrt
// DBHost = db.octopieye.com


const db = mysql.createConnection({
  host: 'host',
  user: 'user_new',
  password: 'pass',
  database: 'db_name'
});

// Query to retrieve data from the database
const query = `select p.user_id,u.name,
case when u.mobile ='' then res.mobile else u.mobile end as mobile
,u.email
,p.prescription_images
from prescription p
left join user u on p.user_id = u.user_id
left join (SELECT REPLACE(address.contact, '+880', '0')  AS mobile , user_id, address.address
		FROM
			address 
		WHERE
			  address.contact <> ''  AND  address.contact IS NOT NULL  ) res on u.user_id = res.user_id 
where 
YEAR(p.date_created) = '2024' 
and p.is_delete = 0
GROUP BY u.user_id`;

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to the database');

  // Execute the query
  db.query(query, (error, results) => {
    if (error) throw error;

    // Loop through each result, modify JSON column, and prepare for Excel

    let file_list = [];
    const modifiedData = results.map(row => {
      // Parse JSON metadata column

      console.log(row.prescription_images)
      let metadataArray = row.prescription_images;

     // Modify each item in the metadata array
    

        
            // Modify each item in place by adding "http://"
        
            // item = "https://cdn.osudpotro.com/" + item;
            // console.log(item);
            // return item
            // Modify each item in place by adding "http://"
        for (let i = 0; i < metadataArray.length; i++) {
            metadataArray[i] = "https://cdn.osudpotro.com/" + metadataArray[i];
            file_list.push(metadataArray[i])
           
        }

        metadataArray = metadataArray.join(", ")

        console.log(metadataArray);
        
        
        // return {
        //   ...item,
        //   modifiedAt: new Date().toISOString()  // Add new property
        // };
    
      // Return the modified row structure
      return {
        // id: row.user_id,
        mobile: row.mobile,
        name: row.name,
        email:row.email,
        prescription_images: JSON.stringify(metadataArray) // Convert back to JSON string for Excel
      };
    });

    // Convert modified data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(modifiedData);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Modified Prescriptions');

    // Write workbook to Excel file
    XLSX.writeFile(workbook, 'modified_prescriptions.xlsx');
    console.log('Excel file created: modified_prescriptions.xlsx');
    
    //downloadFiles(file_list);
    // Close the database connection
    db.end();
  });
});


async function downloadFiles(urls) {
    for (const url of urls) {
      const fileName = path.basename(url);  // Extract file name from URL
      const filePath = path.join(__dirname+'/prescriptions_file', fileName);
  
      try {
        const response = await axios({
          method: 'get',
          url: url,
          responseType: 'stream',
        });
  
        const writer = fs.createWriteStream(filePath);
  
        response.data.pipe(writer);
  
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });
  
        console.log(`Downloaded: ${fileName}`);
      } catch (error) {
        console.error(`Failed to download ${url}:`, error.message);
      }
    }
  }

  function makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}