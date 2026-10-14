import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parents[1]))
from backend.main import conn, init_db
from datetime import datetime, timedelta
samples=[
('The mobile banking app is very easy to use and transactions are fast. Great service!','Mobile Banking','Positive',94),
('Excellent banking experience. Very convenient!','Customer Support','Positive',92),
('ATM was out of service at my branch.','ATM Services','Negative',91),
('Good service but waiting time was long.','Customer Support','Neutral',78),
('Mobile app works great. Love it!','Mobile Banking','Positive',96),
('My card transaction failed twice and support was slow.','Cards','Negative',93),
('Loan application process was smooth and staff were helpful.','Loans & Finance','Positive',90),
('The ATM is usually fast and convenient.','ATM Services','Positive',89),
('I had an issue with a hidden charge on my card.','Cards','Negative',88),
('Branch staff were friendly and helpful.','Branches','Positive',95),
]
c=conn(); c.execute('DELETE FROM reviews'); now=datetime.utcnow()
for i,(t,sent_service,sent,conf) in enumerate(samples): c.execute('INSERT INTO reviews(text,service,sentiment,confidence,created_at) VALUES (?,?,?,?,?)',(t,sent_service,sent,conf/100,(now-timedelta(days=i*3)).isoformat()))
c.commit(); c.close(); print('seeded',len(samples))
