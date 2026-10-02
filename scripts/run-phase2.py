import subprocess
import os
import sys
import time

BASE_DIR = "/Users/pimchayasuprateravarnit/tk-final"
EV_FILE = os.path.join(BASE_DIR, "docs/lab-03/evidence/final-run-2026-10-02.txt")

SEEDED_TICKETS = [
    'TKT-2026-001234', 'TKT-2026-001233', 'TKT-2026-001232', 'TKT-2026-001231',
    'TKT-2026-001230', 'TKT-2026-001229', 'TKT-2026-001228', 'TKT-2026-001227',
    'TKT-2026-001226', 'TKT-2026-001225', 'TKT-2026-001224', 'TKT-2026-001223',
    'TKT-2026-001222', 'TKT-2026-001221', 'TKT-2026-001220', 'TKT-2026-001219',
    'TKT-2026-001218', 'TKT-2026-001217',
]

def run_cmd(cmd, cwd=BASE_DIR, env=None):
    merged_env = os.environ.copy()
    if env:
        merged_env.update(env)
    res = subprocess.run(cmd, cwd=cwd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, env=merged_env)
    return res.returncode, res.stdout

def stop_servers():
    run_cmd("kill -9 $(lsof -t -i:3000 -i:5173) 2>/dev/null || true")
    time.sleep(1)

def start_servers():
    stop_servers()
    # Start server in background
    s_proc = subprocess.Popen("npm run dev --prefix server", cwd=BASE_DIR, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    # Start client in background
    c_proc = subprocess.Popen("npm run dev --prefix client", cwd=BASE_DIR, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    # Wait for servers to be healthy
    for _ in range(30):
        time.sleep(1)
        rc1, _ = run_cmd("curl -s http://localhost:3000/api/health")
        rc2, _ = run_cmd("curl -s -I http://localhost:5173")
        if rc1 == 0 and rc2 == 0:
            return s_proc, c_proc
    print("Warning: servers did not become healthy within 30s")
    return s_proc, c_proc

def get_counts():
    js = """
    const { PrismaClient } = require('./server/node_modules/@prisma/client');
    const prisma = new PrismaClient();
    async function main() {
        const u = await prisma.user.count();
        const t = await prisma.ticket.count();
        console.log(JSON.stringify({ users: u, tickets: t }));
    }
    main().then(() => process.exit(0));
    """
    _, out = run_cmd(f"node -e \"{js}\"")
    import json
    for line in out.split('\n'):
        line = line.strip()
        if line.startswith('{') and line.endswith('}'):
            try:
                return json.loads(line)
            except:
                pass
    return {"users": -1, "tickets": -1}

def cleanup_test_tickets():
    js = f"""
    const {{ PrismaClient }} = require('./server/node_modules/@prisma/client');
    const prisma = new PrismaClient();
    const seeded = {SEEDED_TICKETS};
    async function main() {{
        const unseeded = await prisma.ticket.findMany({{
            where: {{ ticketNumber: {{ notIn: seeded }} }},
            select: {{ id: true }}
        }});
        const ids = unseeded.map(t => t.id);
        if (ids.length > 0) {{
            await prisma.attachment.deleteMany({{ where: {{ ticketId: {{ in: ids }} }} }});
            await prisma.publicComment.deleteMany({{ where: {{ ticketId: {{ in: ids }} }} }});
            await prisma.internalNote.deleteMany({{ where: {{ ticketId: {{ in: ids }} }} }});
            await prisma.ticket.deleteMany({{ where: {{ id: {{ in: ids }} }} }});
        }}
        console.log('Cleaned up', ids.length, 'test tickets');
    }}
    main().then(() => process.exit(0));
    """
    _, out = run_cmd(f"node -e \"{js}\"")
    return out.strip()

def execute_run(run_num, ev_fp):
    print(f"\n==========================================")
    print(f"       STARTING PHASE 2 RUN {run_num}")
    print(f"==========================================")
    ev_fp.write(f"\n==========================================\n")
    ev_fp.write(f"       PHASE 2 RUN {run_num}\n")
    ev_fp.write(f"==========================================\n\n")

    # Ensure background servers are stopped before resetting DB
    stop_servers()

    # 1. Migrate reset + seed
    print("1. Running migrate reset + seed...")
    rc, out = run_cmd("npx prisma migrate reset --force", cwd=os.path.join(BASE_DIR, "server"))
    ev_fp.write(f"--- 1. MIGRATE RESET + SEED (exit {rc}) ---\n{out}\n\n")
    if rc != 0:
        print("ERROR: migrate reset failed!")
        return False, None

    # 2. Note U0, T0
    counts0 = get_counts()
    U0, T0 = counts0['users'], counts0['tickets']
    print(f"2. Baseline counts: users=U0={U0}, tickets=T0={T0}")
    ev_fp.write(f"--- 2. BASELINE COUNTS ---\nusers=U0={U0}, tickets=T0={T0}\n\n")

    # 3. Client build
    print("3. Building client...")
    rc, out = run_cmd("npm --prefix client run build")
    ev_fp.write(f"--- 3. CLIENT BUILD (exit {rc}) ---\n{out}\n\n")
    if rc != 0:
        print("ERROR: client build failed!")
        return False, None

    # 4. Server vitest
    print("4. Running server vitest...")
    rc, out = run_cmd("npm --prefix server test -- --run", env={"NO_COLOR": "1"})
    ev_fp.write(f"--- 4. SERVER VITEST (exit {rc}) ---\n{out}\n\n")
    server_out = out
    if rc != 0:
        print("ERROR: server vitest failed!")
        return False, None

    # 5. Client vitest
    print("5. Running client vitest...")
    rc, out = run_cmd("npm --prefix client test -- --run", env={"NO_COLOR": "1"})
    ev_fp.write(f"--- 5. CLIENT VITEST (exit {rc}) ---\n{out}\n\n")
    client_out = out
    if rc != 0:
        print("ERROR: client vitest failed!")
        return False, None

    # 6. Start servers & run Playwright
    print("6. Starting dev servers and running Playwright chromium suite...")
    s_proc, c_proc = start_servers()
    try:
        rc, out = run_cmd("npx playwright test --project=chromium --reporter=line", env={"NO_COLOR": "1"})
        ev_fp.write(f"--- 6. PLAYWRIGHT CHROMIUM (exit {rc}) ---\n{out}\n\n")
        playwright_out = out
        if rc != 0:
            print("ERROR: Playwright failed!")
            return False, None
    finally:
        stop_servers()

    # 7. Post-test counts & cleanup
    counts1 = get_counts()
    print(f"7. Pre-cleanup post-test counts: users={counts1['users']}, tickets={counts1['tickets']}")
    ev_fp.write(f"--- 7. PRE-CLEANUP POST-TEST COUNTS ---\nusers={counts1['users']}, tickets={counts1['tickets']}\n\n")

    clean_msg = cleanup_test_tickets()
    print(f"   {clean_msg}")
    ev_fp.write(f"--- CLEANUP TEST TICKETS ---\n{clean_msg}\n\n")

    counts2 = get_counts()
    print(f"8. Post-cleanup final counts: users={counts2['users']} (U0={U0}), tickets={counts2['tickets']} (T0={T0})")
    ev_fp.write(f"--- 8. POST-CLEANUP FINAL COUNTS ---\nusers={counts2['users']} (expected {U0}), tickets={counts2['tickets']} (expected {T0})\n\n")

    assert counts2['users'] == U0, f"User count mismatch: {counts2['users']} != {U0}"
    assert counts2['tickets'] == T0, f"Ticket count mismatch: {counts2['tickets']} != {T0}"

    print(f"SUCCESS: Run {run_num} counts match baseline!")
    
    # Extract totals
    # Server: X passed (Y)
    # Client: X passed (Y)
    # Playwright: X passed
    totals = {
        "server": server_out,
        "client": client_out,
        "playwright": playwright_out,
        "U0": U0, "T0": T0,
        "U_final": counts2['users'], "T_final": counts2['tickets']
    }
    return True, totals

def main():
    os.makedirs(os.path.dirname(EV_FILE), exist_ok=True)
    with open(EV_FILE, "w") as ev_fp:
        ev_fp.write("================================================================\n")
        ev_fp.write("TokTickIT Lab 3 - Phase 2 Final Verification Evidence\n")
        ev_fp.write("Date: 2026-10-02\n")
        ev_fp.write("Database: toktickit (localhost:5432, user: postgres)\n")
        ev_fp.write("================================================================\n\n")

        ok1, totals1 = execute_run(1, ev_fp)
        if not ok1:
            print("RUN 1 FAILED")
            sys.exit(1)

        ok2, totals2 = execute_run(2, ev_fp)
        if not ok2:
            print("RUN 2 FAILED")
            sys.exit(1)

    print("\nALL RUNS COMPLETED SUCCESSFULLY. Evidence written to", EV_FILE)

if __name__ == "__main__":
    main()
