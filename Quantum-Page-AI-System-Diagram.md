flowchart TD
    %% Main User Touchpoints
    User[User Browser] --> WebDashboard[Web Dashboard UI]
    MobileUser[Mobile User] --> MobileApp[Mobile Apps<br>iOS & Android]
    
    %% Core Services Layer
    subgraph CoreServices["Core Services Layer"]
        direction LR
        APIGateway[API Gateway<br>GraphQL + REST] --> UserBilling[User & Billing<br>Service]
        APIGateway --> SiteOrch[Site Orchestrator<br>Service]
        APIGateway --> AIEngine[AI Content &<br>SEO Engine]
        APIGateway --> TemplateManager[Template &<br>Asset Manager]
        APIGateway --> Analytics[Analytics &<br>Insights Pipeline]
        APIGateway --> Scheduler[Automation &<br>Scheduler]
        APIGateway --> NotificationBot[Notification &<br>Coaching Bot]
        APIGateway --> MobileGateway[Mobile App<br>Gateway]
    end
    
    %% Connect User Touchpoints to API Gateway
    WebDashboard --> APIGateway
    MobileApp --> MobileGateway
    
    %% Data Storage Layer
    subgraph DataLayer["Data Storage Layer"]
        direction LR
        Postgres[(PostgreSQL<br>Tenant DB)]
        Redis[(Redis Cache<br>& Queue)]
        ObjectStorage[(S3/Blob<br>Assets)]
        ClickHouse[(ClickHouse<br>Analytics)]
        Vault[(HashiCorp<br>Vault)]
    end
    
    %% Cloud Infrastructure
    subgraph CloudInfra["Cloud Infrastructure"]
        direction LR
        K8s[Kubernetes<br>Orchestration]
        AWS[AWS Services]
        Azure[Azure Services]
        CDN[CDN/Edge<br>Services]
    end
    
    %% External Integrations
    subgraph ExternalServices["External Services"]
        direction LR
        Payments[Stripe/Paddle<br>Payments]
        EmailService[Email Services<br>SES/SendGrid]
        SearchConsole[Search Console<br>& Analytics APIs]
        SocialAPIs[Social Media<br>APIs]
        AdNetworks[Ad Networks<br>APIs]
        ThirdPartyAI[Third-party AI<br>OpenAI/Stability]
    end
    
    %% Website Deployments
    subgraph Deployments["Website Deployments"]
        direction LR
        WordPress[WordPress<br>Sites]
        StaticSites[Static JAMstack<br>Sites]
        CloudFunctions[Serverless<br>Functions]
    end
    
    %% Connect Core Services to Data Layer
    UserBilling --> Postgres
    UserBilling --> Vault
    SiteOrch --> Postgres
    SiteOrch --> Vault
    SiteOrch --> ObjectStorage
    AIEngine --> Postgres
    AIEngine --> Redis
    AIEngine --> ObjectStorage
    TemplateManager --> ObjectStorage
    Analytics --> ClickHouse
    Analytics --> Redis
    Scheduler --> Redis
    NotificationBot --> Redis
    NotificationBot --> ClickHouse
    
    %% Connect Core Services to Cloud Infrastructure
    SiteOrch --> K8s
    SiteOrch --> AWS
    SiteOrch --> Azure
    SiteOrch --> CDN
    AIEngine --> K8s
    
    %% Connect to External Services
    UserBilling --> Payments
    NotificationBot --> EmailService
    AIEngine --> ThirdPartyAI
    Scheduler --> SearchConsole
    Scheduler --> SocialAPIs
    Scheduler --> AdNetworks
    
    %% Connect to Deployments
    SiteOrch --> WordPress
    SiteOrch --> StaticSites
    SiteOrch --> CloudFunctions
    
    %% Data Flow Examples
    WebDashboard -- "1. Create Website Request" --> APIGateway
    APIGateway -- "2. Process Request" --> SiteOrch
    SiteOrch -- "3. Provision Infrastructure" --> AWS
    SiteOrch -- "4. Deploy WordPress" --> WordPress
    AIEngine -- "5. Generate Content" --> WordPress
    Analytics -- "6. Collect Metrics" --> ClickHouse
    NotificationBot -- "7. Send Insights" --> MobileApp
    
    %% Styling
    classDef userTouchpoint fill:#4672b4,color:white,stroke:#333,stroke-width:1px
    classDef coreService fill:#47956f,color:white,stroke:#333,stroke-width:1px
    classDef dataStore fill:#de953e,color:white,stroke:#333,stroke-width:1px
    classDef cloudInfra fill:#8b251e,color:white,stroke:#333,stroke-width:1px
    classDef externalService fill:#6b6b6b,color:white,stroke:#333,stroke-width:1px
    classDef deployment fill:#7b4f9d,color:white,stroke:#333,stroke-width:1px
    
    class User,MobileUser,WebDashboard,MobileApp userTouchpoint
    class APIGateway,UserBilling,SiteOrch,AIEngine,TemplateManager,Analytics,Scheduler,NotificationBot,MobileGateway coreService
    class Postgres,Redis,ObjectStorage,ClickHouse,Vault dataStore
    class K8s,AWS,Azure,CDN cloudInfra
    class Payments,EmailService,SearchConsole,SocialAPIs,AdNetworks,ThirdPartyAI externalService
    class WordPress,StaticSites,CloudFunctions deployment
