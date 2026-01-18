const bcrypt = require('bcryptjs');
const pool = require('./db');

/**
 * ------------------------------------------------------------------
 * CYBER LAB - DATABASE INITIALIZATION SCRIPT (2026)
 * ------------------------------------------------------------------
 */
const createInitialAdmin = async () => {
  try {
    // Red Teaming Style Logo (Crimson Red)
    console.log('\x1b[31m%s\x1b[0m', `
                                               %###%%                                               
                                          %%############%%                                          
                                      %######################%                                      
                                 %##############%%%%#############%%                                 
                            %##############%%          %%##########%%#%%                            
                       %###############%                    %%#%%#####%%%%#%%                       
                  %%##############%                              %%%%%#%%%%%%%%%%%                  
              %##############%                                        %#%%%%%%%%%%%%%%              
         %##############%%                                                %%%%%%%%%%%%%%%%%         
      %#############%                                                          %%%%%%%%%%%%%%%      
      %########%                                                                    %%%%%%%%%%      
      %######%                                                                        %%%%%%%%      
      %######%                                                                        %%%%%%%%      
      %######%                                                                        %%%%%%%%      
      %######%                                                                        %%%%%%%%      
      %######%                                                                        %%%%%%%%      
      %######%                                                                        %%%%%%%%      
      %######%                                            ====                        %%%%%%%%      
      %######%                                           ======                       %%%%%%%%      
      %######%                                           ======                       %%%%%%%%      
      %######%                                           ======                       %%%%%%%%      
      %######%                %###############################%%%%%%%%                %%%%%%%%      
      %######%               ##############################%#%%%%%%%%%%               %%%%%%%%      
      %######%              #############################%%%%%%%%%%%%%%%              %%%%%%%%      
      %######%              %##########################%%%%%%%%%%%%%%%%%              %%%%%%%%      
      %######%              %#######################%%%%%%%%%%%%%%%%%%%%              %%%%%%%%      
      %######%              %#################%@@@@@@%%%%%%%%%%%%%%%%%%%              %%%%%%%%      
      %######%              %###############%@@@@@@@@@@%%%%%%%%%%%%%%%%%              %%%%%%%%      
      %######%              %###############@@@@@@@@@@@@%%%%%%%%%%%%%%%%              %%%%%%%%      
      %######%              %#############%%@@@@@@@@@@@@%%%%%%%%%%%%%%%%              %%%%%%%%      
      %######%              %############%%%%@@@@@@@@@@%%%%%%%%%%%%%%%%%              %%%%%%%%      
      %######%              %#########%%%%%%%%@@@@@@@@%%%%%%%%%%%%%%%%%%              %%%%%%%%      
      %######%              %######%%%%%%%%%%%%%@@@@%%%%%%%%%%%%%%%%%%%%              %%%%%%%%      
      %######%              %####%%%%%%%%%%%%%%%@@@@%%%%%%%%%%%%%%%%%%%%              %%%%%%%%      
      %######%              %##%%%%%%%%%%%%%%%%%@@@@%%%%%%%%%%%%%%%%%%%%              %%%%%%%%      
      %######%              %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@@              %%%%%%%%      
      %######%               %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%@@@               %%%%%%%%      
      %######%%%%              %%%%%%%###%%%%%%%%%%%%%%%%%%%%%%%%@@%@              %%%%%%%%%%%      
       %#%#%#%#%%%#%%                ======                                    %%%%%%%%%%%%%%       
          %%%%%%%%%%%%%%             ======                                 %%%%%%%%%%%%%%          
              %%%%%%%%%%%%%%         ======                             %%%%%%%%%%%%%@              
                  %%%%%%%%%%%%%                                      %%%%%%%%%%%%%                  
                     %%%%%%%%%%%%%%                              %%%%%%%%%%%%%@                     
                         %%%%%%%%%%%%%%                      %%%%%%%%%%%%%%                         
                            %%%%%%%%%%%%%%                %%%%%%%%%%%%%@                            
            ::::::  :::: :::: ::::::-%%+::::::: :::::::=%%%%%%+:-%%%    :::::   ::::::::            
           :::  :::  ::::::   :::  ::=%+:-%%%%%%-::%%*:-%%%%%%=::       :::::   :::  :::            
          :::         ::::    :::::::  ::::::-%%+::::::*%%%%% :::      ::: :::  ::::::::            
          ::::  :::    :::    :::  ::: ::: %%%%%+:-%=::%%     :::      :::::::  :::   :::           
            ::::::     :::    :::::::: ::::::::%=:-%%::::     ::::::: :::   ::: ::::::::            
    `);

    // Credits & Status
    console.log('\x1b[31m%s\x1b[0m', '   >>> DEVELOPED BY: Osamah Amer (2026) <<<');
    console.log('\x1b[37m%s\x1b[0m', '   >>> SYSTEM STATUS: INITIALIZING CORE MODULES...\n');

    // Drop tables to ensure clean slate
    const dropTablesQuery = `
      DROP TABLE IF EXISTS authenticators CASCADE;
      DROP TABLE IF EXISTS token_blacklist CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `;
    await pool.query(dropTablesQuery);

    const createTablesQuery = `
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        mfa_secret TEXT,                
        current_challenge TEXT,         
        has_fido BOOLEAN DEFAULT FALSE, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE authenticators (
        credential_id TEXT PRIMARY KEY,
        credential_public_key TEXT NOT NULL, 
        counter BIGINT DEFAULT 0,
        transports TEXT,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- FIX: Added UNIQUE constraint to 'token' for ON CONFLICT support
      CREATE TABLE token_blacklist (
        id SERIAL PRIMARY KEY,
        token TEXT UNIQUE NOT NULL, 
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createTablesQuery);

    // Create Admin User
    const adminEmail = 'admin@lab.com';
    const adminPass = 'lab123';
    const hashedPassword = await bcrypt.hash(adminPass, 10);

    await pool.query(
      "INSERT INTO users (name, email, password, is_admin) VALUES ($1, $2, $3, $4)",
      ['Cyber Lab Admin', adminEmail, hashedPassword, true]
    );

    console.log('\x1b[32m%s\x1b[0m', ' [+] SYSTEM: Database schema verified for ALL Labs.');
    console.log('\x1b[33m%s\x1b[0m', ` [+] ACCESS: ${adminEmail} / ${adminPass}`);

  } catch (err) {
    console.error('\x1b[31m%s\x1b[0m', ' [!] CRITICAL ERROR:', err.message);
  }
};

module.exports = { createInitialAdmin };