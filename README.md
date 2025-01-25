# 🚀 Waconn Project

### **About**
Waconn is a simple WhatsApp automation project built to send text messages and images seamlessly. Developed with Node.js and Puppeteer, this bot streamlines messaging tasks for users who want to save time and boost productivity.

> ⚡ **80% coded by my bestie: ChatGPT.**  
> 🤝 Enhanced with ideas, debugging, and fine-tuning by yours truly!

---

### **Features**
- 📝 Send automated text messages.
- 📷 Send images to contacts or groups.
- 🔒 Auto-login with session storage.
- ⚙️ Built with Puppeteer for optimized browser automation.

---

### **Requirements**
1. Node.js (v16+)
2. NPM or Yarn
3. Active WhatsApp Web account

---

### **Installation**
1. Clone this repository:
   ```bash
   git clone https://github.com/cakracomp/waconn.git
2. Navigate to the project folder:
   ```bash
   cd waconn
3. Install the dependencies:
   ```bash
   npm install
4. Create the required database tables:
   * Import the database/schema.sql file into your MySQL database:
   ```bash
   mysql -u username -p database_name < database/schema.sql
   ```
   * This will create the sess_wa and crm_h2 tables.
5. Run the application:
    ```bash
    npm start

---

### **Usage**
1. Login to WhatsApp Web
   * If you set headless: false, WhatsApp Web will automatically open in the browser, and you can scan the QR Code directly.
   * If you are running the app in headless: true, the QR Code will be saved in the sess_wa table as text. You can use this text in your own application to display the QR Code as an \<img> tag.
   * After the QR Code is scanned and the session is successfully connected, the sess_wa table will be updated by filling in the phone number of the connected account in the number column. This indicates in the database that the session is active and ready to send messages or images.
2. Input Phone Numbers and Messages
   * Add the phone number and message text in the crm_h2 table using your preferred database management tool.
   * Example data in crm_h2:
  
| idcrm | nama       | hp           | isi          | resp    |
|-------|------------|--------------|--------------|---------|
| 1     | John Doe   | 628123456789 | Hello there! | pending |

3. Message Sending
   * Waconn will check the crm_h2 table every 30 seconds.
   * Messages with the resp column set to pending will be sent via WhatsApp.
   * Once the message is sent successfully:
        * The resp column will be updated to sent.
        * The sentdate column will be filled with the current timestamp.


---

### **Contributions**
💡 Ideas, pull requests, or bug reports are always welcome! Feel free to collaborate and make this bot even better. Let's build together!
Acknowledgements
💖 Support the Project
If you find this project helpful, consider supporting by donating:

* PayPal: https://paypal.me/HasanAzharry
* Trakteer: https://teer.id/cakrasys

---

### **Acknowledgements**
* Thanks to Puppeteer for browser automation.
* And of course, ChatGPT, my coding buddy. 🔥

---

### **Disclaimer**

This project is provided as-is and is not affiliated with or endorsed by WhatsApp or its parent company, Meta. The developer assumes no responsibility for any issues, risks, or damages that may arise from using this code. Use it at your own discretion.







