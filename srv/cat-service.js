const INSERT = require("@sap/cds/lib/ql/INSERT");
const { deprecated } = require("@sap/cds/lib/utils/cds-utils");

module.exports = cds.service.impl( async function() {
    // Step-1 : Get the object from our ODATA Entities
    let { EmployeeService, BusinessPartnerService, PurchaseOrderService } = this.entities ;
    
    // Step-2 : Define generic handler for the pre-checks
    this.before('UPDATE', EmployeeService, (request, response) => {
        console.log(request.data.salaryAmount);
        if(parseFloat(request.data.salaryAmount) >= 100000){
            request.error(500, "Please get the approval from your line manager");
        }
    })
    this.before('INSERT', EmployeeService, (request, response) => {
        console.log(request.data.salaryAmount);
        if(parseFloat(request.data.salaryAmount) >= 100000){
            request.error(500, "Please get the approval from your line manager");
        }
    })
    this.on('createEmployee', async(request, response) => {
        const dataset = request.data;
        let returninfo = await cds.tx(request).run([
            INSERT.into('SALESORDERS_DB_MASTER_EMPLYEES').entries(dataset)
        ]).then((resolve, reject)=>{
            if(typeof(resolve) != undefined) {
                return request.data;
            } else {
                request.error(500, "Error in the creation of employee");
            }
        }).catch(err => {
            request.error(500,"There is an error "+err.toString());
        })
        return returninfo;
    })
    this.on('largestOrder', async(request, response) => {
        try {
           const tx = cds.tx(request);

           const response = await tx.read(PurchaseOrderService).orderBy({
                GROSS_AMOUNT : 'desc'
           }).limit(5);

           return response ;
        } catch (error) {
            return "Error : " + error.toString();
        }
    })

    this.on('smallestOrder', async(request, response) => {
        try {
           const tx = cds.tx(request);

           const response = await tx.read(PurchaseOrderService).orderBy({
                GROSS_AMOUNT : 'asc'
           }).limit(5);

           return response ;
        } catch (error) {
            return "Error : " + error.toString();
        }
    })
    this.on('discountOnPrice', async(request, response) => {
        try {
            // Get the parameters
            const ID = request.params[0];
            const { discount }  = request.data ;

            // Decalre the transaction package
            const tx = cds.tx(request);

            // CDS Query Language - Commnunicate the DB
            await tx.update(PurchaseOrderService).with({
                GROSS_AMOUNT : { '-=' : 1000 },
                NET_AMOUNT : { '-=' : 900 },
                TAX_AMOUNT : { '-=' : 100 }
            }).where(ID);
        } catch (error) {
            return "Error : " + error.toString();
        }
    })
    this.on('getMaleEmployees', async(request, response) => {
        try {
            const tx = cds.tx(request);
            const response = await tx.read(EmployeeService).where({
                gender : 'M'
            }).limit(10);
            return response;
        } catch (error) {
            request.error(500,error);
        }
    });
this.on('SendRequest', async (request, response) => {
        try {
 
            let id = uuid(); // generates a new UUID
            const propertyID = request.params[0];
            const requestMessage = request.data;
 
            const newContactReq = {
                ID: id,
                property_ID: propertyID,
                requester_ID: '4g2b1c0d-9d55-4e77-f999-1e2f3a4b5c56',
                requestMessage: requestMessage,
            }
 
            const tx = cds.transaction(request);
 
            const insertResult = await tx.run(
                INSERT.into('RJ_RE_MANAGEMYPROPERTY_CONTACTREQUESTS').entries(newContactReq)
            );
            return 'Contact request for Property ID ${propertyID} successfully logged.';
        } catch (error) {
            return "Error: " + error.toString();
        }
 
    });
})