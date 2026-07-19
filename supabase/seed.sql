-- ===========================================================================
-- Local development seed data
--
-- Applied automatically by `supabase db reset`. Mirrors the four tracks
-- advertised on the home page (src/content/home.ts) so the catalogue, course
-- detail, and lesson viewer pages all have something real to render.
--
-- YouTube ids below are PLACEHOLDERS for local development only — swap them
-- for real unlisted course videos before this ever runs against production.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Course 1: Cloud Foundations (free)
-- ---------------------------------------------------------------------------

insert into public.courses
  (id, slug, title, subtitle, description, level, category, is_free, price_cents,
   status, duration_minutes, sort_order, published_at)
values (
  '10000000-0000-4000-8000-000000000001',
  'cloud-foundations',
  'Cloud Foundations',
  'How the cloud actually works — compute, storage, networking and identity.',
  'Cloud Foundations is your first step into infrastructure. You will create a real AWS free-tier account and learn the services that every other track builds on: compute, storage, networking and identity. By the end you will be comfortable navigating the AWS console and explaining what actually happens when a website is "in the cloud".',
  'beginner', 'Cloud', true, 0, 'published', 240, 1, now()
);

insert into public.modules (id, course_id, title, summary, sort_order) values
  ('10000000-0001-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
   'Welcome to the Cloud', 'Why the cloud exists and what problem it solves.', 1),
  ('10000000-0001-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001',
   'Core AWS Services', 'The building blocks used in almost every cloud system.', 2);

insert into public.lessons
  (id, module_id, course_id, title, slug, type, content_mdx, youtube_id, duration_seconds, sort_order, is_preview)
values
  ('10000000-0002-4000-8000-000000000001', '10000000-0001-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001', 'What is Cloud Computing?', 'what-is-cloud-computing',
   'text', $md$## Renting someone else's computer

Cloud computing means using someone else's servers over the internet instead of buying and running your own hardware. When you deploy an app "to the cloud," you are really renting compute, storage and networking from a company like Amazon (AWS), Microsoft (Azure) or Google (GCP), by the hour or by usage.

## Why this matters for your career

Almost every Sri Lankan tech job posting now mentions AWS, Azure or GCP. Companies stopped buying physical servers years ago because the cloud is:

- **Elastic** — you can add or remove capacity in minutes, not weeks
- **Pay-as-you-go** — you are billed for what you use, not for hardware sitting idle
- **Global** — your app can run close to users anywhere in the world

## The three service models

| Model | You manage | Provider manages | Example |
|---|---|---|---|
| IaaS | OS, runtime, app | Physical hardware, networking | AWS EC2 |
| PaaS | Just your app | OS, runtime, scaling | AWS Elastic Beanstalk |
| SaaS | Nothing | Everything | Gmail, Slack |

This course focuses on **IaaS** — the layer closest to the metal, and the one that teaches you the most about how systems actually work.

> Every lesson from here uses AWS's free tier. You will not need to enter a credit card that gets charged for anything in this course.$md$,
   null, 360, 1, true),

  ('10000000-0002-4000-8000-000000000002', '10000000-0001-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000001', 'A Tour of AWS', 'a-tour-of-aws',
   'video', null, 'dQw4w9WgXcQ', 480, 2, false),

  ('10000000-0002-4000-8000-000000000003', '10000000-0001-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000001', 'Understanding EC2', 'understanding-ec2',
   'text', $md$## What is EC2?

**EC2 (Elastic Compute Cloud)** is AWS's virtual server service. An EC2 "instance" is a virtual machine you control completely — you choose the operating system, install whatever software you want, and pay only while it is running.

## Key concepts

- **AMI (Amazon Machine Image)** — a template containing the OS and pre-installed software your instance boots from
- **Instance type** — the hardware profile (CPU, RAM) you are renting, e.g. `t2.micro` is free-tier eligible
- **Security group** — a virtual firewall controlling what traffic can reach your instance
- **Key pair** — the SSH credential used to log in, since there is no password by default

## Try it yourself

```bash
# Once you have an instance running and its public IP, connect with:
ssh -i my-key.pem ec2-user@<public-ip>
```

Free tier gives you 750 hours per month of a `t2.micro` instance — enough to run one instance continuously for a full month at zero cost.$md$,
   null, 300, 1, false),

  ('10000000-0002-4000-8000-000000000004', '10000000-0001-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000001', 'Understanding S3', 'understanding-s3',
   'text', $md$## What is S3?

**S3 (Simple Storage Service)** stores files ("objects") in containers called **buckets**. Unlike a hard drive, S3 has no folders in the traditional sense — object keys like `images/profile/avatar.png` just look like a path.

## Why it matters

S3 is where CloudIskole itself stores payment slips and course PDFs. It is durable (AWS states 99.999999999% durability), cheap, and accessible over plain HTTPS.

## Storage classes

| Class | Use case | Relative cost |
|---|---|---|
| Standard | Frequently accessed files | Highest |
| Infrequent Access | Backups, older files | Medium |
| Glacier | Long-term archive | Lowest |

## Bucket policies matter

An S3 bucket is **private by default**. Every major cloud data leak you have read about involving "an exposed S3 bucket" happened because someone changed that default without understanding the consequences. Always ask: *who should be able to read this, and who should be able to write it?* — the same question our own database's row-level security answers for every table.$md$,
   null, 300, 2, false),

  ('10000000-0002-4000-8000-000000000005', '10000000-0001-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000001', 'Setting Up Your Free Tier Account', 'setting-up-free-tier',
   'video', null, 'dQw4w9WgXcQ', 600, 3, false);

-- ---------------------------------------------------------------------------
-- Course 2: Linux & Networking (free)
-- ---------------------------------------------------------------------------

insert into public.courses
  (id, slug, title, subtitle, description, level, category, is_free, price_cents,
   status, duration_minutes, sort_order, published_at)
values (
  '20000000-0000-4000-8000-000000000001',
  'linux-networking',
  'Linux & Networking',
  'Command line fluency, servers, SSH and the networking every interview asks about.',
  'The ground floor of every IT career. This course builds real command-line fluency and the networking fundamentals — DNS, HTTP, TCP/IP — that show up in almost every technical interview, regardless of which specialisation you choose next.',
  'beginner', 'Linux', true, 0, 'published', 200, 2, now()
);

insert into public.modules (id, course_id, title, summary, sort_order) values
  ('20000000-0001-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001',
   'The Command Line', 'Moving around a Linux system with confidence.', 1),
  ('20000000-0001-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001',
   'Networking Fundamentals', 'How machines actually find and talk to each other.', 2);

insert into public.lessons
  (id, module_id, course_id, title, slug, type, content_mdx, youtube_id, duration_seconds, sort_order, is_preview)
values
  ('20000000-0002-4000-8000-000000000001', '20000000-0001-4000-8000-000000000001',
   '20000000-0000-4000-8000-000000000001', 'Why Every Engineer Needs Linux', 'why-every-engineer-needs-linux',
   'text', $md$## Linux runs the internet

Over 95% of the world's cloud servers run Linux. Every AWS EC2 instance, every Docker container, every Kubernetes node — almost all of it is Linux underneath. If DevOps or Cloud is your goal, the terminal is not optional.

## The good news

You do not need to memorise hundreds of commands. Real engineers use maybe 20 commands daily and look up the rest. This course teaches you those 20, plus — more importantly — how to *think* about a Linux system: everything is a file, every program can be piped into another, and the manual (`man <command>`) is always one keystroke away.

## What's next

The next lesson gets your hands on a real terminal — no installation needed, since AWS's free-tier EC2 instance from the Cloud Foundations course works perfectly here too.$md$,
   null, 240, 1, true),

  ('20000000-0002-4000-8000-000000000002', '20000000-0001-4000-8000-000000000001',
   '20000000-0000-4000-8000-000000000001', 'Navigating the Filesystem', 'navigating-the-filesystem',
   'text', $md$## The core commands

```bash
pwd                 # print working directory — where am I?
ls -la               # list everything, including hidden files, with details
cd /var/log          # change directory
cat app.log           # print a whole file to the screen
tail -f app.log        # watch a file as new lines are appended — essential for debugging
```

## Everything is a file

In Linux, devices, processes and configuration are all represented as files. `/etc` holds configuration, `/var/log` holds logs, `/home/<you>` is your personal space. Once this clicks, the whole system stops feeling arbitrary.

## Permissions, briefly

```bash
ls -l app.sh
# -rwxr-xr-- 1 ubuntu ubuntu 220 Jul 19 10:02 app.sh
```

That `rwxr-xr--` breaks into three groups of three: **owner**, **group**, **everyone else** — each with **r**ead, **w**rite, **execute**. This is the same owner-vs-everyone-else thinking behind every access-control system you will meet later, including the row-level security that protects this very course platform's database.$md$,
   null, 300, 2, false),

  ('20000000-0002-4000-8000-000000000003', '20000000-0001-4000-8000-000000000002',
   '20000000-0000-4000-8000-000000000001', 'How DNS Works', 'how-dns-works',
   'text', $md$## Turning names into addresses

Computers address each other by IP address (e.g. `142.250.183.78`), but humans type `google.com`. **DNS (Domain Name System)** is the phonebook that connects the two.

## The lookup chain

1. Your browser asks a **resolver** (often run by your ISP) "where is cloudiskole.lk?"
2. The resolver asks a **root server** which company manages `.lk` domains
3. It asks the `.lk` **TLD server** who manages `cloudiskole.lk` specifically
4. It asks that **authoritative server** for the actual IP address
5. The answer is cached and returned to your browser

## Common record types

| Record | Purpose |
|---|---|
| A | Maps a name to an IPv4 address |
| CNAME | Maps a name to another name (an alias) |
| MX | Where email for this domain should be delivered |
| TXT | Arbitrary text — often used to prove domain ownership |

Next time a website feels slow to load, it is sometimes DNS resolution, not the server itself.$md$,
   null, 280, 1, false),

  ('20000000-0002-4000-8000-000000000004', '20000000-0001-4000-8000-000000000002',
   '20000000-0000-4000-8000-000000000001', 'TCP/IP Explained', 'tcp-ip-explained',
   'video', null, 'dQw4w9WgXcQ', 540, 2, false);

-- ---------------------------------------------------------------------------
-- Course 3: DevOps Engineering (paid — Rs 25,000)
-- ---------------------------------------------------------------------------

insert into public.courses
  (id, slug, title, subtitle, description, level, category, is_free, price_cents,
   status, duration_minutes, sort_order, published_at)
values (
  '30000000-0000-4000-8000-000000000001',
  'devops-engineering',
  'DevOps Engineering',
  'Build real pipelines that take code from your laptop to production automatically.',
  'The track employers hire for. You will use Git properly in a team setting, containerise a real application with Docker, and build a CI/CD pipeline with GitHub Actions that tests and deploys automatically. This is the highest-demand, highest-paid entry point into Sri Lankan tech.',
  'intermediate', 'DevOps', false, 2500000, 'published', 420, 3, now()
);

insert into public.modules (id, course_id, title, summary, sort_order) values
  ('30000000-0001-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001',
   'Version Control', 'Using Git the way real engineering teams do.', 1),
  ('30000000-0001-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001',
   'Containers', 'Packaging an application so it runs the same everywhere.', 2),
  ('30000000-0001-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001',
   'CI/CD', 'Automating tests and deployment on every push.', 3);

insert into public.lessons
  (id, module_id, course_id, title, slug, type, content_mdx, youtube_id, duration_seconds, sort_order, is_preview)
values
  ('30000000-0002-4000-8000-000000000001', '30000000-0001-4000-8000-000000000001',
   '30000000-0000-4000-8000-000000000001', 'Git Fundamentals for Teams', 'git-fundamentals-for-teams',
   'text', $md$## Beyond `git add` and `git commit`

If you have used Git solo, you already know the basics. Team Git is different: the goal shifts from "save my work" to "let five people change the same codebase without destroying each other's work."

```bash
git checkout -b feature/payment-retry   # create a branch for your change
git commit -m "Retry failed payment webhooks with backoff"
git push -u origin feature/payment-retry
```

## The pull request is the real deliverable

A commit message explains *what* changed. A pull request explains *why* — and is where a teammate reviews your code before it reaches production. Write commit messages and PR descriptions as if the reader has none of the context in your head, because in six months, neither will you.$md$,
   null, 360, 1, true),

  ('30000000-0002-4000-8000-000000000002', '30000000-0001-4000-8000-000000000001',
   '30000000-0000-4000-8000-000000000001', 'Branching Strategies', 'branching-strategies',
   'text', $md$## Why teams need a convention

Without an agreed strategy, a shared repository turns into chaos within a week. Two common approaches:

### Trunk-based development
Everyone branches briefly off `main` and merges back within a day or two. Favoured by teams that deploy continuously — fewer long-lived branches means fewer painful merges.

### GitFlow
Separate `develop`, `feature/*`, `release/*` and `hotfix/*` branches with stricter rules. Better suited to software shipped in scheduled releases rather than deployed continuously.

## What actually matters

The specific strategy matters less than everyone on the team following the *same* one. CloudIskole's own codebase uses trunk-based development: short-lived branches, frequent small PRs, `main` always deployable.$md$,
   null, 300, 2, false),

  ('30000000-0002-4000-8000-000000000003', '30000000-0001-4000-8000-000000000002',
   '30000000-0000-4000-8000-000000000001', 'Docker from Zero', 'docker-from-zero',
   'video', null, 'dQw4w9WgXcQ', 720, 1, false),

  ('30000000-0002-4000-8000-000000000004', '30000000-0001-4000-8000-000000000002',
   '30000000-0000-4000-8000-000000000001', 'Writing Your First Dockerfile', 'writing-your-first-dockerfile',
   'text', $md$## What a Dockerfile does

A `Dockerfile` is a recipe for building a container image — a snapshot containing your app plus everything it needs to run, so it behaves identically on your laptop, a teammate's laptop, and in production.

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## Line by line

- `FROM` — the base image to start from (a minimal Node.js runtime here)
- `WORKDIR` — sets the working directory inside the container
- `COPY package*.json` then `RUN npm ci` **before** copying the rest of the code — this lets Docker cache the dependency install step, so it only reruns when `package.json` actually changes
- `CMD` — the command that runs when a container starts from this image

Build it with `docker build -t my-app .` and run it with `docker run -p 3000:3000 my-app`.$md$,
   null, 300, 2, false),

  ('30000000-0002-4000-8000-000000000005', '30000000-0001-4000-8000-000000000003',
   '30000000-0000-4000-8000-000000000001', 'Building a Pipeline with GitHub Actions', 'building-a-pipeline-with-github-actions',
   'video', null, 'dQw4w9WgXcQ', 660, 1, false);

-- ---------------------------------------------------------------------------
-- Course 4: Software Engineering (paid — Rs 18,000)
-- ---------------------------------------------------------------------------

insert into public.courses
  (id, slug, title, subtitle, description, level, category, is_free, price_cents,
   status, duration_minutes, sort_order, published_at)
values (
  '40000000-0000-4000-8000-000000000001',
  'software-engineering',
  'Software Engineering',
  'Programming fundamentals, version control and the working habits of a hireable engineer.',
  'Programming fundamentals taught the way working engineers actually think, not the way a textbook does. You will write real Python, use Git from day one, and build the debugging instincts that separate someone who copies code from someone who understands it.',
  'beginner', 'Programming', false, 1800000, 'published', 320, 4, now()
);

insert into public.modules (id, course_id, title, summary, sort_order) values
  ('40000000-0001-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001',
   'Programming Foundations', 'The concepts every language shares.', 1),
  ('40000000-0001-4000-8000-000000000002', '40000000-0000-4000-8000-000000000001',
   'Working With Code', 'Habits that make you effective in a real codebase.', 2);

insert into public.lessons
  (id, module_id, course_id, title, slug, type, content_mdx, youtube_id, duration_seconds, sort_order, is_preview)
values
  ('40000000-0002-4000-8000-000000000001', '40000000-0001-4000-8000-000000000001',
   '40000000-0000-4000-8000-000000000001', 'Thinking Like a Programmer', 'thinking-like-a-programmer',
   'text', $md$## It's not about syntax

Beginners think learning to program means memorising syntax. It doesn't. Programming is breaking a big, vague problem into small, precise steps a computer can follow exactly.

## An example

"Sort these exam results by score" sounds simple until you ask precise questions:
- Highest first, or lowest first?
- What happens when two students tie?
- Does the original list change, or do we return a new one?

Answering these *before* writing code is the actual skill. The code itself is often the easy part once the steps are precise.

## What comes next

The next lessons introduce Python — chosen because its syntax gets out of the way of the thinking, which is exactly what you are here to practise first.$md$,
   null, 300, 1, true),

  ('40000000-0002-4000-8000-000000000002', '40000000-0001-4000-8000-000000000001',
   '40000000-0000-4000-8000-000000000001', 'Python Basics: Variables and Types', 'python-basics-variables-and-types',
   'text', $md$## Variables

A variable is a name attached to a value:

```python
student_name = "Nimali"
al_year = 2025
is_enrolled = True
```

Python figures out the type automatically — `student_name` is a string, `al_year` is an integer, `is_enrolled` is a boolean. This is different from languages like Java where you must declare the type yourself.

## The core types

| Type | Example | Notes |
|---|---|---|
| `str` | `"hello"` | Text, always in quotes |
| `int` | `42` | Whole numbers |
| `float` | `3.14` | Decimal numbers |
| `bool` | `True` / `False` | Exactly two values |
| `list` | `[1, 2, 3]` | Ordered, changeable collection |

## Try it

```python
score = 78
pass_mark = 60
passed = score >= pass_mark
print(f"Passed: {passed}")
```

Run this and you should see `Passed: True`.$md$,
   null, 340, 2, false),

  ('40000000-0002-4000-8000-000000000003', '40000000-0001-4000-8000-000000000002',
   '40000000-0000-4000-8000-000000000001', 'Git Workflows for Beginners', 'git-workflows-for-beginners',
   'text', $md$## The three commands you will use constantly

```bash
git status    # what has changed?
git add .     # stage everything that changed
git commit -m "Add score validation"   # save a snapshot with a message
```

## Commit often, in small pieces

A common beginner mistake is writing 300 lines of code before the first commit. If something breaks, you cannot tell which part caused it. Commit every time you reach a small working state — after adding one function, after fixing one bug — so `git log` becomes a readable story of how the code grew.

## Undo without fear

```bash
git diff              # see exactly what changed, before committing
git restore file.py    # discard changes to a file you regret
```

Git's whole purpose is to make experimentation safe. Once you trust that you can always get back to a working state, you code more boldly.$md$,
   null, 280, 1, false),

  ('40000000-0002-4000-8000-000000000004', '40000000-0001-4000-8000-000000000002',
   '40000000-0000-4000-8000-000000000001', 'Debugging Like a Pro', 'debugging-like-a-pro',
   'video', null, 'dQw4w9WgXcQ', 500, 2, false);
