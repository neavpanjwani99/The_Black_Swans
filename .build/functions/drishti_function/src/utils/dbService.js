'use strict';

const catalyst = require('zcatalyst-sdk-node');

const dbService = {
  /**
   * Initialize and return the Catalyst App instance from the HTTP request context.
   * @param {Object} [req] - Incoming Express/HTTP Request object
   */
  getCatalystApp(req) {
    try {
      if (req) {
        return catalyst.initialize(req);
      }
      return catalyst.initialize();
    } catch (error) {
      console.warn('Catalyst SDK initialization warning (running in fallback/standalone mode):', error.message || error);
      return null;
    }
  },

  /**
   * Fetch rows from a Catalyst Data Store table using ZCQL
   * @param {string} tableName - Name of the Data Store table (e.g., 'Firs')
   * @param {Object} [req] - Incoming request object
   */
  async getRows(tableName, req) {
    const app = this.getCatalystApp(req);
    if (!app) return [];

    try {
      const zcql = app.zcql();
      const query = `SELECT * FROM ${tableName}`;
      const queryResult = await zcql.executeZCQLQuery(query);
      if (Array.isArray(queryResult)) {
        return queryResult.map(row => row[tableName] || row);
      }
      return [];
    } catch (error) {
      console.warn(`ZCQL query execution warning for table '${tableName}':`, error.message || error);
      return [];
    }
  },

  /**
   * Insert a single row into a Data Store table
   * @param {string} tableName - Name of the Data Store table
   * @param {Object} rowData - Key-value pair object matching table columns
   * @param {Object} [req] - Incoming request object
   */
  async insertRow(tableName, rowData, req) {
    const app = this.getCatalystApp(req);
    if (!app) {
      console.warn(`Local fallback: Simulated row insertion into table '${tableName}'.`);
      return { ROWID: `MOCK-${Date.now()}`, ...rowData };
    }

    try {
      const table = app.datastore().table(tableName);
      const insertedRow = await table.insertRow(rowData);
      return insertedRow;
    } catch (error) {
      console.error(`Failed to insert row into Catalyst table '${tableName}':`, error.message || error);
      throw error;
    }
  },

  /**
   * Retrieve a row by its ROWID
   * @param {string} tableName 
   * @param {string|number} rowId 
   * @param {Object} [req] 
   */
  async getRowById(tableName, rowId, req) {
    const app = this.getCatalystApp(req);
    if (!app) return null;

    try {
      const table = app.datastore().table(tableName);
      return await table.getRow(rowId);
    } catch (error) {
      console.error(`Failed to fetch row '${rowId}' from table '${tableName}':`, error.message || error);
      return null;
    }
  },

  /**
   * Update an existing row (rowData must contain ROWID)
   * @param {string} tableName 
   * @param {Object} rowData 
   * @param {Object} [req] 
   */
  async updateRow(tableName, rowData, req) {
    const app = this.getCatalystApp(req);
    if (!app) return rowData;

    try {
      const table = app.datastore().table(tableName);
      return await table.updateRow(rowData);
    } catch (error) {
      console.error(`Failed to update row in table '${tableName}':`, error.message || error);
      throw error;
    }
  },

  /**
   * Delete a row by its ROWID
   * @param {string} tableName 
   * @param {string|number} rowId 
   * @param {Object} [req] 
   */
  async deleteRow(tableName, rowId, req) {
    const app = this.getCatalystApp(req);
    if (!app) return true;

    try {
      const table = app.datastore().table(tableName);
      return await table.deleteRow(rowId);
    } catch (error) {
      console.error(`Failed to delete row '${rowId}' from table '${tableName}':`, error.message || error);
      throw error;
    }
  }
};

module.exports = { dbService };
