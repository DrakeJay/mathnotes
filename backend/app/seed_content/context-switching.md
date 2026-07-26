Your laptop is running a browser, an editor, a compiler, a music player, and a hundred background daemons. Your CPU has maybe eight cores. The arithmetic doesn't work — and yet nothing appears to be waiting. The trick is that no program actually runs continuously. Each one gets the processor for a few milliseconds, is frozen mid-instruction, and is thawed later so precisely that it never learns it was interrupted. That freeze-and-thaw is the **context switch**, and it is the single mechanism that turns one processor into the illusion of many.

## What exactly is a "process", to the hardware?

The [CPU lesson](/lessons/cpu-fetch-decode-execute) built a machine with a program counter, a few registers, and a memory it reads instructions from. Notice what's *not* in that machine: any notion of "which program is running." The processor has no such concept. It fetches from `PC`, computes on registers, and repeats.

So a running program, as far as the hardware is concerned, is exactly three things:

- **The registers** — `PC` (where in the code it is), the stack pointer (where its [call stack](/lessons/stack-in-memory) is), and the general-purpose registers holding its working values.
- **The address space** — the page tables that translate its virtual addresses into physical memory, so its `0x400000` and another process's `0x400000` land in different places.
- **The kernel's bookkeeping** — open files, permissions, its slot in the run queue.

Together these are the process's **context**, and the kernel stores it in a struct called the **process control block** (PCB) — `task_struct` in Linux. When a process isn't running, the PCB *is* the process: a few hundred bytes of frozen state in kernel memory, waiting.

## The switch, stage by stage

Because the running process's state lives in the registers, switching processes means copying that state out and copying another one in. Step through it:

<demo name="context-switch"></demo>

The stages are worth naming, because each one is a different kind of cost:

1. **Interrupt.** A hardware timer fires. The CPU stops the running process between two instructions, flips to **kernel mode** (a privilege bit that unlocks the instructions user code isn't allowed to run), and jumps to the kernel's handler. Crucially the process doesn't cooperate and isn't asked — this is **preemption**, and it's why one runaway loop can't freeze your machine.
2. **Save.** The kernel copies the registers into the outgoing process's PCB. This is the *entire* act of "stopping" a program.
3. **Schedule.** The kernel picks who runs next. This is the only step with any policy in it; everything else is bookkeeping.
4. **Switch address space.** Point the page-table base register at the incoming process's tables. The same virtual addresses now mean different physical memory — and the TLB (the cache of address translations) is suddenly full of answers for the wrong process.
5. **Restore.** Copy the incoming process's saved registers back onto the CPU.
6. **Resume.** Return from the interrupt into user mode. The incoming process continues at the exact instruction it was stopped at, with no way to tell that hours may have passed.

The deep point is that step 2 and step 5 are *just copying*. Nothing is "paused" in any richer sense — a process is data, and switching processes is moving data around.

## What it costs

The direct cost is small: saving and restoring a few dozen registers and swapping a page-table pointer takes on the order of **1–5 microseconds**, a few thousand cycles. Against a typical Linux time slice of a few milliseconds, that's well under 1% of the CPU.

The *indirect* cost is the one that hurts. The incoming process arrives to caches and a TLB stuffed with the outgoing process's data — everything the [memory hierarchy lesson](/lessons/memory-hierarchy) said about locality is momentarily false, and the first thousands of accesses miss all the way to RAM at ~200 cycles each. Measured end to end, the true cost of a switch is often several times the direct cost, and for a process with a large working set it can be far more.

Which sets up the fundamental tension. Switch often and the machine feels instant but wastes its time switching; switch rarely and the machine is efficient but sluggish. If the time slice is $q$ and a switch costs $c$, the fraction of wall-clock time spent doing useful work is

$$\text{efficiency} \approx \frac{q}{q + c}$$

while the worst-case wait before a ready process gets the CPU, with $n$ processes runnable, is about $(n-1)(q+c)$. One knob, two goals, pulling in opposite directions.

## Watch the trade-off

Three processes want one CPU: a 12-tick compile, a 5-tick browser render, a 3-tick editor keystroke. Choose a policy, then drag the time slice and the switch cost.

<demo name="scheduler"></demo>

At the default switch cost of 1 tick, the table tells the whole story:

| Policy | Switches | Efficiency | Avg response | Avg turnaround |
| --- | --- | --- | --- | --- |
| First come, first served | 2 | 90.9% | 8.7 | 15.3 |
| Round robin, slice = 2 | 8 | 71.4% | **2.0** | 20.7 |
| Shortest job first | 2 | 90.9% | 8.0 | **14.7** |

Three things to take from it:

- **First come, first served is the most efficient and the least usable.** Almost no switching, so almost no waste — but the editor keystroke sits behind a 12-tick compile. This is exactly the experience of a machine that has stopped responding.
- **Round robin buys responsiveness with overhead.** Dropping the slice to 1 tick gets average response down to 1.3 ticks and burns **39%** of the CPU on switching. Raising it to 6 recovers 87% efficiency and pushes response back out to 4.7. Slide it and watch the two columns move in opposite directions — that slider *is* the tension in the formula above.
- **Shortest job first wins on turnaround, and can starve you.** Running short jobs first provably minimizes average turnaround time — but it requires knowing burst lengths in advance (you don't), and a stream of short jobs means a long one never runs at all.

Now push the switch cost to 4 ticks. Round robin with a 2-tick slice collapses to **38.5%** efficiency: the machine spends more time switching than working. That collapse is called **thrashing**, and it's what a real scheduler is built to avoid.

Real schedulers are compromises around this same trade. Linux's CFS gives each runnable process a slice proportional to its weight, sized so that every process runs at least once per few-millisecond window, with a floor on the slice so that overhead can't run away when many processes are runnable.

## Threads, and why they're cheaper

A **thread** is a process's context minus the address space: its own registers and stack, but the same page tables and the same memory as its siblings. Switching between two threads of the same process therefore skips stage 4 entirely — no page-table swap, no TLB flush, and the caches stay warm because both threads are touching the same data.

That single skipped stage is most of the reason threads are called "lightweight," and why servers handling thousands of connections reach for threads (or for user-space coroutines, which switch even less — just a stack pointer and a program counter, with the kernel never involved).

## The takeaway

A process is not a mysterious living thing inside the machine; it is a snapshot of registers plus a memory map, and the operating system multiplexes one CPU among many programs by saving one snapshot and loading another a few hundred times a second. The mechanism is almost trivially simple — copy registers to memory, copy other registers back — and the interesting part is entirely in the *policy*: how long to let each process run before doing it again. Too long and your machine feels frozen; too short and it burns its cycles on the switching itself. Every operating system you've ever used is a particular answer to that one question.
