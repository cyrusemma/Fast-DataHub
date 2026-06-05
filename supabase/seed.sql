INSERT INTO data_bundles (network,name,data_size_mb,validity_days,cost_price,selling_price,agent_price,reseller_price) VALUES
('MTN','MTN 100MB Daily',100,1,100,150,120,130),
('MTN','MTN 1GB Weekly',1024,7,500,700,550,600),
('MTN','MTN 3GB Monthly',3072,30,1200,1600,1300,1400),
('MTN','MTN 10GB Monthly',10240,30,3500,4500,3800,4000),
('TELECEL','Telecel 200MB Daily',200,1,120,180,140,155),
('TELECEL','Telecel 1.5GB Weekly',1536,7,600,800,650,700),
('TELECEL','Telecel 4GB Monthly',4096,30,1400,1900,1550,1650),
('TELECEL','Telecel 12GB Monthly',12288,30,4000,5000,4200,4500),
('AT','AT 150MB Daily',150,1,110,160,130,140),
('AT','AT 1GB Weekly',1024,7,520,720,570,620),
('AT','AT 3.5GB Monthly',3584,30,1300,1750,1400,1500),
('AT','AT 8GB Monthly',8192,30,2800,3600,3000,3200)
ON CONFLICT DO NOTHING;
