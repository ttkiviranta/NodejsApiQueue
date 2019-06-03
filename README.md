Azurelab
==============

In this project I use NServiceBus(NSB) as a communication link between a client and a server. I used existing Visual Studio solution which based on C# and MVC .NET Core application I had developed a while ago:
https://github.com/ttkiviranta/WebHomelab. The problem with this solutions is that it is very monolithic. Anyway, this was a qood way to learn new things using application that I already know well.


The solution consists of the Azurelab application and the client(s), please refer to the picture below:

![Solution](solution.png)

This application, Azurelab, used .NET Core Web API with MS SQL database. Application is hosted in Azure Service Fabric based on Web Api, NServiceBus, SQL Server, Azure Storage Queues and Azure Storage Presence.

**Architecture**

Azurelab application implements CQRS by letting the WebAPI query the database directly via GET commands and do all PUT/POST/DELETE commands via NSB. See picture below:

![Architecture](Architecture.png)


**Database Diagram**

![Database](Database.png)

**Graphical User Interface**

![G U I](GUI.png)

When user open *Products* -window, client starts update products prices, one product per secund.

There is an other client GUI in this solution with less functionality:

![G U I V U E](GUIVUE.png)

This GUI based on *VUE* with *TypeScript* and *AXIOS*, *BootstrapVUE* with *Pagination* component.


**NSB Transport and Persistence**

In Azurelab application, there is two types of transport queuses are configured. The first one is used for sending command messages and the second one sent event messages with higher priority. The message *UpdateProductLockedStatus* is used with higher priority. When user wants to update product, the *product* object is locked in the database and status is "Offline". If the editing takes longer than 40 seconds, the lock will be removed. See code below:

        private static bool ProductHasBeenLocked40Seconds(ProductRead product)
        {
            return new DateTime(product.ProductLockedStatus.LockedTimeStamp).AddMilliseconds(40000) < DateTime.Now;
        }

        // GET api/Product
        [EnableCors("AllowAllOrigins")]
        [HttpGet]
        public async Task<IEnumerable<ProductRead>> GetProductsAsync()
        //  public IEnumerable<ProductRead> GetProducts()
        {
            var list = new List<ProductRead>();
            var products = _dataAccessRead.GetProducts();
            Dictionary<string, int> queueLengthForEachProduct = await GetQueueLenghtForEachProduct();

            foreach (var product in products)
            {
                if (product.ProductLockedStatus.Locked)
                {
                    if (ProductHasBeenLocked40Seconds(product))
                    { //Lock timed out and can be ignored and set to false
                        var updateProductLockedStatus = new UpdateProductLockedStatus
                        {
                            LockedStatus = false,
                            LockedStatusID = product.ProductLockedStatus.LockedStatusID,
                            ProductId = product.ProductId,
                            UpdateProductLockedTimeStamp = DateTime.Now.Ticks
                        };...

In other words, when user update product, locked procedure will happening immediately and changes will hapen later.

**Key words**

Visual Studio 2017, ASP.NET Core, MSSQL Server, Azure Service Fabric, NServiceBus, Microservices, C#, JavaScript, TypeScript, VUE, Axios, BootstrapVue, DataTables, JQuery

**Screen captures**

Swagger:![Swagger](swagger.png) 

Service Fabric Explorer:![Service Fabric](ServiceFabric.png)

Azure Storage Explorer:![Storage Exporer](StorageExporer.png)

Fiddler:![Fiddler](Fiddler.png)