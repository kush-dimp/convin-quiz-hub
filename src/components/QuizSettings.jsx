import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'
import {
  ChevronLeft, Timer, RefreshCw, Layout, BarChart2, Shield,
  MessageSquare, Award, Link as LinkIcon, Save, Check,
  Clock, AlertTriangle, Eye, EyeOff, Globe, Lock, Smartphone,
  Monitor, Key, Calendar, Zap, FileText, Copy, ExternalLink, X,
} from 'lucide-react'
import { useQuiz, useQuizzes } from '../hooks/useQuizzes'
import CertificateRenderer, { CERT_W, CERT_H } from './CertificateRenderer'

const TABS = [
  { id: 'timing',      label: 'Timing',        icon: Timer         },
  { id: 'attempts',    label: 'Attempts',       icon: RefreshCw     },
  { id: 'presentation',label: 'Presentation',   icon: Layout        },
  { id: 'scoring',     label: 'Scoring',        icon: BarChart2     },
  { id: 'security',    label: 'Security',       icon: Shield        },
  { id: 'feedback',    label: 'Feedback',       icon: MessageSquare },
  { id: 'certificate', label: 'Certificate',    icon: Award         },
  { id: 'integration', label: 'Integration',    icon: LinkIcon      },
]

function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className={`relative inline-flex w-10 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}>
      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  )
}

function Row({ label, description, children }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}

/* ── Prompt 17: Timing ───────────────────────────────────────── */
function TimingSettings({ settings, onSettingChange }) {
  const hasLimit = settings.time_limit_mins !== null && settings.time_limit_mins !== undefined
  const [perQ, setPerQ]               = useState(false)
  const [perQTime, setPerQTime]       = useState(60)
  const [showTimer, setShowTimer]     = useState('always')
  const [autoSubmit, setAutoSubmit]   = useState(true)
  const [allowPause, setAllowPause]   = useState(false)
  const [latePolicy, setLatePolicy]   = useState('deny')

  function handleToggleLimit(val) {
    onSettingChange('time_limit_mins', val ? 45 : null)
  }

  return (
    <div className="space-y-6">
      <Section title="Time Limit">
        <Row label="Enable time limit" description="Set a maximum duration for the quiz">
          <Toggle checked={hasLimit} onChange={handleToggleLimit} />
        </Row>
        {hasLimit && (
          <Row label="Duration" description="Total time allowed for the quiz">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={settings.time_limit_mins ?? 45}
                min={1} max={480}
                onChange={e => onSettingChange('time_limit_mins', +e.target.value)}
                className="w-20 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50"
              />
              <span className="text-sm text-slate-500">minutes</span>
            </div>
          </Row>
        )}
        <Row label="Per-question time limit" description="Each question has its own timer">
          <Toggle checked={perQ} onChange={setPerQ} />
        </Row>
        {perQ && (
          <Row label="Default per-question time" description="Seconds per question">
            <div className="flex items-center gap-2">
              <input type="number" value={perQTime} min={5} max={600} onChange={e => setPerQTime(+e.target.value)} className="w-20 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-slate-50" />
              <span className="text-sm text-slate-500">seconds</span>
            </div>
          </Row>
        )}
        <Row label="Shuffle questions" description="Randomize question order for each taker">
          <Toggle checked={settings.shuffle_questions} onChange={v => onSettingChange('shuffle_questions', v)} />
        </Row>
        <Row label="Shuffle answer options" description="Randomize option order for each question">
          <Toggle checked={settings.shuffle_options} onChange={v => onSettingChange('shuffle_options', v)} />
        </Row>
      </Section>
      <Section title="Timer Display">
        <Row label="Show countdown timer">
          <select value={showTimer} onChange={e => setShowTimer(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-slate-50 focus:outline-none">
            <option value="always">Always</option>
            <option value="last5">Last 5 minutes only</option>
            <option value="never">Never</option>
          </select>
        </Row>
        <Row label="Auto-submit when time expires" description="Automatically submit when timer reaches 0">
          <Toggle checked={autoSubmit} onChange={setAutoSubmit} />
        </Row>
        <Row label="Allow pause" description="Students can pause the timer (practice mode only)">
          <Toggle checked={allowPause} onChange={setAllowPause} />
        </Row>
      </Section>
      <Section title="Late Submission">
        <Row label="Late submission policy">
          <select value={latePolicy} onChange={e => setLatePolicy(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-slate-50 focus:outline-none">
            <option value="deny">Do not allow</option>
            <option value="penalty10">Allow with 10% penalty</option>
            <option value="penalty25">Allow with 25% penalty</option>
            <option value="allow">Allow without penalty</option>
          </select>
        </Row>
      </Section>
    </div>
  )
}

/* ── Prompt 18: Attempts ─────────────────────────────────────── */
function AttemptSettings({ settings, onSettingChange }) {
  const maxAttempts = String(settings.max_attempts ?? 1)
  const [delay, setDelay]             = useState('none')
  const [showPrev, setShowPrev]       = useState(true)
  const [retakePolicy, setRetakePolicy] = useState('same')
  const [countAs, setCountAs]         = useState('highest')
  const [lockAfterFail, setLockAfterFail] = useState(false)
  const [showHistory, setShowHistory] = useState(true)

  function handleMaxAttempts(val) {
    const n = val === 'unlimited' ? 0 : parseInt(val, 10)
    onSettingChange('max_attempts', isNaN(n) ? 1 : n)
  }

  return (
    <div className="space-y-6">
      <Section title="Attempt Limits">
        <Row label="Number of attempts allowed">
          <select value={maxAttempts === '0' ? 'unlimited' : maxAttempts} onChange={e => handleMaxAttempts(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-slate-50 focus:outline-none">
            {['1','2','3','5','unlimited'].map(v => <option key={v} value={v}>{v === 'unlimited' ? 'Unlimited' : v}</option>)}
          </select>
        </Row>
        <Row label="Delay between attempts">
          <select value={delay} onChange={e => setDelay(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-slate-50 focus:outline-none">
            <option value="none">No delay</option>
            <option value="1h">1 hour</option>
            <option value="1d">1 day</option>
            <option value="1w">1 week</option>
          </select>
        </Row>
        <Row label="Show previous scores before retaking" description="Users see their last score before starting a new attempt">
          <Toggle checked={showPrev} onChange={setShowPrev} />
        </Row>
        <Row label="Lock quiz after all attempts failed" description="Prevent further attempts after exhausting all tries">
          <Toggle checked={lockAfterFail} onChange={setLockAfterFail} />
        </Row>
      </Section>
      <Section title="Retake Policy">
        <Row label="Question source on retake">
          <select value={retakePolicy} onChange={e => setRetakePolicy(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-slate-50 focus:outline-none">
            <option value="same">Show same questions</option>
            <option value="shuffle">Randomize question order</option>
            <option value="new">New random questions from pool</option>
          </select>
        </Row>
        <Row label="Score to record">
          <select value={countAs} onChange={e => setCountAs(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-slate-50 focus:outline-none">
            <option value="highest">Highest score</option>
            <option value="latest">Latest attempt</option>
            <option value="average">Average of all attempts</option>
            <option value="first">First attempt only</option>
          </select>
        </Row>
        <Row label="Show attempt history to user" description="Users can review all their past attempts">
          <Toggle checked={showHistory} onChange={setShowHistory} />
        </Row>
      </Section>
    </div>
  )
}

/* ── Prompt 19: Presentation ─────────────────────────────────── */
function PresentationSettings({ settings, onSettingChange }) {
  const [mode, setMode]              = useState('one_per_page')
  const [showNumbers, setShowNumbers]= useState(true)
  const [showProgress, setShowProgress] = useState('percentage')
  const [allowBack, setAllowBack]    = useState(true)
  const [markReview, setMarkReview]  = useState(true)
  const [examMode, setExamMode]      = useState(false)
  const [showNav, setShowNav]        = useState(true)

  const modes = [
    { id: 'one_per_page', label: 'One per page',    desc: 'Navigate with Previous / Next buttons' },
    { id: 'all_on_page',  label: 'All on one page', desc: 'Scroll to view all questions'          },
    { id: 'sectioned',    label: 'Section-based',   desc: 'Questions grouped by category/section' },
    { id: 'randomized',   label: 'Randomized',      desc: 'Different order for each user'          },
  ]

  return (
    <div className="space-y-6">
      <Section title="Presentation Mode">
        <div className="grid grid-cols-2 gap-2">
          {modes.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)} className={`text-left p-3 rounded-xl border-2 transition-all ${mode === m.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
              <p className={`text-sm font-semibold ${mode === m.id ? 'text-indigo-700' : 'text-slate-800'}`}>{m.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Navigation & Display">
        <Row label="Show question numbers"><Toggle checked={showNumbers} onChange={setShowNumbers} /></Row>
        <Row label="Show question navigation sidebar" description="Panel showing answered/unanswered status">
          <Toggle checked={showNav} onChange={setShowNav} />
        </Row>
        <Row label="Allow going back to previous questions">
          <Toggle checked={allowBack} onChange={setAllowBack} />
        </Row>
        <Row label="Mark for review functionality" description="Let users flag questions to revisit">
          <Toggle checked={markReview} onChange={setMarkReview} />
        </Row>
        <Row label="Progress display">
          <select value={showProgress} onChange={e => setShowProgress(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-slate-50 focus:outline-none">
            <option value="percentage">Percentage (75%)</option>
            <option value="fraction">Fraction (15 of 20)</option>
            <option value="both">Both</option>
            <option value="none">Hide</option>
          </select>
        </Row>
      </Section>
      <Section title="Exam Mode">
        <Row label="Exam mode" description="Full screen, disables copy/paste, right-click, and tab switching">
          <Toggle checked={examMode} onChange={setExamMode} />
        </Row>
        {examMode && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
            Exam mode requires modern browsers. Tab switching will be detected and logged.
          </div>
        )}
      </Section>
    </div>
  )
}

/* ── Prompt 20: Scoring Rules ────────────────────────────────── */
function ScoringRules({ settings, onSettingChange }) {
  const [method, setMethod]         = useState('points')
  const [gradeScale, setGradeScale] = useState('percentage')
  const [roundScore, setRoundScore] = useState('nearest1')
  const [manualEssay, setManualEssay] = useState(true)
  const [curve, setCurve]           = useState(0)

  const methods = [
    { id: 'points',     label: 'Points-based',    desc: 'Sum of correct answer points'      },
    { id: 'percentage', label: 'Percentage',       desc: 'Correct / total × 100'             },
    { id: 'weighted',   label: 'Weighted',         desc: 'Different weights per question'    },
    { id: 'pass_fail',  label: 'Pass / Fail only', desc: 'No numeric score shown'            },
  ]

  return (
    <div className="space-y-6">
      <Section title="Scoring Method">
        <div className="grid grid-cols-2 gap-2">
          {methods.map(m => (
            <button key={m.id} onClick={() => setMethod(m.id)} className={`text-left p-3 rounded-xl border-2 transition-all ${method === m.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
              <p className={`text-sm font-semibold ${method === m.id ? 'text-indigo-700' : 'text-slate-800'}`}>{m.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Grade Settings">
        <Row label="Grading scale">
          <select value={gradeScale} onChange={e => setGradeScale(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-slate-50 focus:outline-none">
            <option value="percentage">0–100%</option>
            <option value="letter">A–F</option>
            <option value="pass_fail">Pass/Fail</option>
            <option value="custom">Custom</option>
          </select>
        </Row>
        <Row label="Passing score" description="Minimum score to pass the quiz">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={settings.passing_score_pct ?? 70}
              min={0} max={100}
              onChange={e => onSettingChange('passing_score_pct', +e.target.value)}
              className="w-20 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-center focus:outline-none bg-slate-50"
            />
            <span className="text-sm text-slate-500">%</span>
          </div>
        </Row>
        <Row label="Score rounding">
          <select value={roundScore} onChange={e => setRoundScore(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-slate-50 focus:outline-none">
            <option value="none">No rounding</option>
            <option value="nearest05">Nearest 0.5</option>
            <option value="nearest1">Nearest whole number</option>
          </select>
        </Row>
        <Row label="Score curve (add points)" description="Add bonus points to all scores">
          <div className="flex items-center gap-2">
            <input type="number" value={curve} min={0} max={20} onChange={e => setCurve(+e.target.value)} className="w-20 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-center focus:outline-none bg-slate-50" />
            <span className="text-sm text-slate-500">pts</span>
          </div>
        </Row>
      </Section>
      <Section title="Results Visibility">
        <Row label="Show results immediately" description="Display score immediately after submission">
          <Toggle checked={settings.show_results_immediately} onChange={v => onSettingChange('show_results_immediately', v)} />
        </Row>
        <Row label="Show correct answers" description="Reveal correct answers after submission">
          <Toggle checked={settings.show_correct_answers} onChange={v => onSettingChange('show_correct_answers', v)} />
        </Row>
        <Row label="Allow review" description="Let users review their answers after submission">
          <Toggle checked={settings.allow_review} onChange={v => onSettingChange('allow_review', v)} />
        </Row>
        <Row label="Manual scoring for essays" description="Essay questions require instructor review">
          <Toggle checked={manualEssay} onChange={setManualEssay} />
        </Row>
      </Section>
    </div>
  )
}

/* ── Prompt 21: Security ─────────────────────────────────────── */
function SecuritySettings({ settings, onSettingChange }) {
  const [ipRestrict, setIpRestrict]   = useState(false)
  const [ipRange, setIpRange]         = useState('192.168.0.0/24')
  const [deviceRestrict, setDeviceRestrict] = useState('all')
  const [tabDetect, setTabDetect]     = useState(true)
  const [copyBlock, setCopyBlock]     = useState(false)
  const [rightClick, setRightClick]   = useState(false)
  const [schedule, setSchedule]       = useState(false)
  const [startDate, setStartDate]     = useState('')
  const [endDate, setEndDate]         = useState('')

  return (
    <div className="space-y-6">
      <Section title="Access Control">
        <Row label="Private quiz" description="Only accessible via direct link or invite">
          <Toggle checked={settings.is_private} onChange={v => onSettingChange('is_private', v)} />
        </Row>
        <Row label="Require access code" description="Users must enter a password to start">
          <Toggle checked={settings.password_protected} onChange={v => onSettingChange('password_protected', v)} />
        </Row>
        {settings.password_protected && (
          <Row label="Access code">
            <div className="flex items-center gap-2">
              <input
                value={settings.access_password}
                onChange={e => onSettingChange('access_password', e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none w-32 bg-slate-50"
              />
              <button
                onClick={() => onSettingChange('access_password', Math.random().toString(36).slice(2,10).toUpperCase())}
                className="text-xs text-indigo-600 hover:text-indigo-700"
              >
                Regenerate
              </button>
            </div>
          </Row>
        )}
        <Row label="IP address restriction">
          <Toggle checked={ipRestrict} onChange={setIpRestrict} />
        </Row>
        {ipRestrict && (
          <Row label="Allowed IP range / CIDR">
            <input value={ipRange} onChange={e => setIpRange(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-44 focus:outline-none font-mono bg-slate-50" />
          </Row>
        )}
        <Row label="Device restriction">
          <select value={deviceRestrict} onChange={e => setDeviceRestrict(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-slate-50 focus:outline-none">
            <option value="all">All devices</option>
            <option value="desktop">Desktop only</option>
            <option value="no_mobile">No mobile</option>
          </select>
        </Row>
      </Section>
      <Section title="Scheduled Availability">
        <Row label="Restrict by date/time"><Toggle checked={schedule} onChange={setSchedule} /></Row>
        {schedule && (
          <>
            <Row label="Start date/time">
              <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-slate-50 focus:outline-none" />
            </Row>
            <Row label="End date/time">
              <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-slate-50 focus:outline-none" />
            </Row>
          </>
        )}
      </Section>
      <Section title="Anti-Cheat">
        <Row label="Tab switching detection" description="Log and warn when user switches browser tabs"><Toggle checked={tabDetect} onChange={setTabDetect} /></Row>
        <Row label="Block copy/paste" description="Prevent text selection and pasting"><Toggle checked={copyBlock} onChange={setCopyBlock} /></Row>
        <Row label="Disable right-click"><Toggle checked={rightClick} onChange={setRightClick} /></Row>
        <Row label="Webcam proctoring (optional)" description="Record webcam during quiz session"><Toggle checked={settings.require_proctoring} onChange={v => onSettingChange('require_proctoring', v)} /></Row>
        {settings.require_proctoring && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">Browser permission will be requested before the quiz starts. Recording is stored securely for 30 days.</div>
        )}
      </Section>
    </div>
  )
}

/* ── Prompt 22: Feedback ─────────────────────────────────────── */
function FeedbackSettings({ settings, onSettingChange }) {
  const [feedbackMode, setFeedbackMode] = useState('deferred')
  const [showExpl, setShowExpl]     = useState(true)
  const [hints, setHints]           = useState(false)
  const [hintDelay, setHintDelay]   = useState(30)
  const [peerComp, setPeerComp]     = useState(true)
  const [improvement, setImprovement] = useState(true)

  const rangeFeedback = [
    { range: '90–100%', msg: 'Excellent! Outstanding performance.',       color: 'text-green-700 bg-green-50 border-green-200' },
    { range: '70–89%',  msg: 'Good job! You passed the quiz.',            color: 'text-blue-700  bg-blue-50  border-blue-200'  },
    { range: '50–69%',  msg: 'Almost there. Consider reviewing the material.', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { range: '0–49%',   msg: 'Keep trying! Review the course content.',   color: 'text-red-700   bg-red-50   border-red-200'   },
  ]

  return (
    <div className="space-y-6">
      <Section title="Feedback Timing">
        <div className="grid grid-cols-2 gap-2">
          {[{ id: 'immediate', label: 'Immediate', desc: 'Show after each question' }, { id: 'deferred', label: 'Deferred', desc: 'Show after full submission' }].map(m => (
            <button key={m.id} onClick={() => setFeedbackMode(m.id)} className={`text-left p-3 rounded-xl border-2 transition-all ${feedbackMode === m.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'}`}>
              <p className={`text-sm font-semibold ${feedbackMode === m.id ? 'text-indigo-700' : 'text-slate-800'}`}>{m.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
      </Section>
      <Section title="Feedback Content">
        <Row label="Show explanations" description="Display detailed explanation for each answer"><Toggle checked={showExpl} onChange={setShowExpl} /></Row>
        <Row label="Show hints" description="Let users request hints during the quiz"><Toggle checked={hints} onChange={setHints} /></Row>
        {hints && (
          <Row label="Hint appears after" description="Seconds before hint button is available">
            <div className="flex items-center gap-2">
              <input type="number" value={hintDelay} min={0} max={300} onChange={e => setHintDelay(+e.target.value)} className="w-16 border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm text-center focus:outline-none bg-slate-50" />
              <span className="text-sm text-slate-500">seconds</span>
            </div>
          </Row>
        )}
        <Row label="Peer comparison" description="Show percentile ranking (opt-in for users)"><Toggle checked={peerComp} onChange={setPeerComp} /></Row>
        <Row label="Improvement suggestions" description="Recommend topics based on incorrect answers"><Toggle checked={improvement} onChange={setImprovement} /></Row>
      </Section>
      <Section title="Score-Range Feedback Messages">
        <div className="space-y-2">
          {rangeFeedback.map(({ range, msg, color }) => (
            <div key={range} className={`flex items-center gap-3 p-3 rounded-xl border ${color}`}>
              <span className="text-xs font-bold w-16 flex-shrink-0">{range}</span>
              <input defaultValue={msg} className="flex-1 bg-transparent text-xs border-0 focus:outline-none focus:underline" />
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

/* ── Prompt 23: Certificate ──────────────────────────────────── */
function CertificateSettings({ settings, onSettingChange, quizTitle }) {
  const enabled = settings.certificate_enabled

  // Parse stored JSON on mount / when settings.certificate_template changes
  const tpl = useMemo(() => {
    try { return JSON.parse(settings.certificate_template || '{}') } catch { return {} }
  }, [settings.certificate_template])

  const [template, setTemplate]         = useState(tpl.template     ?? 'classic')
  const [primaryColor, setPrimaryColor] = useState(tpl.primaryColor ?? '#4F46E5')
  const [criterion, setCriterion]       = useState(tpl.criterion    ?? 'pass')
  const [expiry, setExpiry]             = useState(tpl.expiry        ?? 'never')
  const [qrCode, setQrCode]             = useState(tpl.qrCode        ?? true)
  const [autoEmail, setAutoEmail]       = useState(tpl.autoEmail      ?? true)
  const [showPreview, setShowPreview]   = useState(false)

  // Re-sync local state when the quiz first loads (tpl object reference changes once)
  useEffect(() => {
    setTemplate(tpl.template     ?? 'classic')
    setPrimaryColor(tpl.primaryColor ?? '#4F46E5')
    setCriterion(tpl.criterion    ?? 'pass')
    setExpiry(tpl.expiry           ?? 'never')
    setQrCode(tpl.qrCode           ?? true)
    setAutoEmail(tpl.autoEmail     ?? true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.certificate_template]) // intentionally deps on the raw string

  function updateTpl(patch) {
    const next = { template, primaryColor, criterion, expiry, qrCode, autoEmail, ...patch }
    onSettingChange('certificate_template', JSON.stringify(next))
  }

  const templates = [
    { id: 'classic',    label: 'Classic',    preview: 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300'  },
    { id: 'modern',     label: 'Modern',     preview: 'bg-gradient-to-br from-indigo-50 to-blue-100 border-indigo-300' },
    { id: 'minimalist', label: 'Minimalist', preview: 'bg-white border-slate-300'                                       },
    { id: 'corporate',  label: 'Corporate',  preview: 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300'  },
  ]

  const dynamicFields = ['{name}', '{quiz_title}', '{score}', '{date}', '{certificate_id}', '{instructor}']

  // Scale factor for the preview modal (fit within 80vw × 80vh)
  return (
    <div className="space-y-6">
      <Row label="Enable certificate issuance" description="Award certificates upon quiz completion/passing">
        <Toggle checked={enabled} onChange={v => onSettingChange('certificate_enabled', v)} />
      </Row>
      {enabled && (
        <>
          <Section title="Certificate Template">
            <div className="grid grid-cols-2 gap-2">
              {templates.map(t => (
                <button key={t.id} onClick={() => { setTemplate(t.id); updateTpl({ template: t.id }) }}
                  className={`p-3 rounded-xl border-2 transition-all ${template === t.id ? 'border-indigo-500' : 'border-transparent hover:border-slate-200'}`}>
                  <div className={`h-16 rounded-lg border-2 flex items-center justify-center ${t.preview}`}>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Certificate</span>
                  </div>
                  <p className={`text-xs font-semibold mt-1.5 ${template === t.id ? 'text-indigo-600' : 'text-slate-600'}`}>{t.label}</p>
                </button>
              ))}
            </div>
          </Section>
          <Section title="Customization">
            <Row label="Primary color">
              <input type="color" value={primaryColor}
                onChange={e => { setPrimaryColor(e.target.value); updateTpl({ primaryColor: e.target.value }) }}
                className="w-10 h-8 rounded-lg border border-slate-200 cursor-pointer" />
            </Row>
            <Row label="Issue certificate when">
              <select value={criterion}
                onChange={e => { setCriterion(e.target.value); updateTpl({ criterion: e.target.value }) }}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-slate-50 focus:outline-none">
                <option value="pass">Quiz passed (above passing score)</option>
                <option value="complete">Any completion</option>
                <option value="perfect">Perfect score only</option>
              </select>
            </Row>
            <Row label="Certificate expiry">
              <select value={expiry}
                onChange={e => { setExpiry(e.target.value); updateTpl({ expiry: e.target.value }) }}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-slate-50 focus:outline-none">
                <option value="never">Never expires</option>
                <option value="1y">1 year</option>
                <option value="2y">2 years</option>
              </select>
            </Row>
            <Row label="Include QR verification code">
              <Toggle checked={qrCode} onChange={v => { setQrCode(v); updateTpl({ qrCode: v }) }} />
            </Row>
            <Row label="Email certificate automatically" description="Send certificate email to user on issuance">
              <Toggle checked={autoEmail} onChange={v => { setAutoEmail(v); updateTpl({ autoEmail: v }) }} />
            </Row>
          </Section>
          <Section title="Dynamic Fields">
            <p className="text-xs text-slate-500">Available placeholders in certificate text:</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {dynamicFields.map(f => (
                <code key={f} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg border border-indigo-100 font-mono">{f}</code>
              ))}
            </div>
          </Section>
          <button
            onClick={() => setShowPreview(true)}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-indigo-300 text-indigo-600 text-sm font-semibold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" /> Preview Certificate
          </button>
        </>
      )}

      {/* Preview Modal */}
      {showPreview && (() => {
        const availW = window.innerWidth  * 0.92
        const availH = window.innerHeight * 0.92 - 64
        const scale   = Math.min(availW / CERT_W, availH / CERT_H, 1)
        const scaledW = Math.round(CERT_W * scale)
        const scaledH = Math.round(CERT_H * scale)
        return (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-4 gap-4"
               onClick={() => setShowPreview(false)}>
            {/* Close button — always visible above cert */}
            <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowPreview(false)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 text-white text-sm font-semibold hover:bg-white/30 transition-colors">
                <X className="w-4 h-4" /> Close Preview
              </button>
            </div>
            {/* Wrapper sized to scaled dimensions so flex layout is correct */}
            <div onClick={e => e.stopPropagation()} style={{
              position: 'relative',
              width: scaledW,
              height: scaledH,
              flexShrink: 0,
              boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
              borderRadius: 8,
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0,
                width: CERT_W, height: CERT_H,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}>
                <CertificateRenderer
                  cert={{ id: 'PREVIEWP', issued_at: new Date().toISOString() }}
                  quizTitle={quizTitle || 'Sample Quiz'}
                  userName="Jane Smith"
                  scorePct={95}
                  template={template}
                  primaryColor={primaryColor}
                />
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

/* ── Prompt 24: Integration ──────────────────────────────────── */
function IntegrationSettings({ settings, onSettingChange }) {
  const [embedType, setEmbedType] = useState('iframe')
  const quizId = 'quiz_abc123'
  const iframeCode = `<iframe src="https://quizplatform.com/embed/${quizId}" width="100%" height="600" frameborder="0"></iframe>`
  const jsCode     = `<div id="quiz-embed" data-quiz="${quizId}"></div>\n<script src="https://quizplatform.com/embed.js"></script>`

  const webhooks = [
    { event: 'quiz_started',   url: '' },
    { event: 'quiz_completed', url: '' },
    { event: 'quiz_passed',    url: '' },
  ]
  const [hooks, setHooks] = useState(webhooks)

  const integrations = [
    { name: 'Google Classroom', icon: '📚', connected: false },
    { name: 'Microsoft Teams',  icon: '💼', connected: true  },
    { name: 'Slack',            icon: '💬', connected: false },
    { name: 'Zapier',           icon: '⚡', connected: false },
    { name: 'Moodle',           icon: '🎓', connected: false },
    { name: 'Canvas LMS',       icon: '🖼️', connected: false },
  ]

  return (
    <div className="space-y-6">
      <Section title="Embed Code">
        <div className="flex gap-2 mb-3">
          {['iframe','javascript'].map(t => (
            <button key={t} onClick={() => setEmbedType(t)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${embedType === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t === 'iframe' ? 'iFrame' : 'JS Widget'}</button>
          ))}
        </div>
        <div className="relative">
          <pre className="bg-gray-900 text-green-400 text-xs p-4 rounded-xl overflow-x-auto leading-relaxed font-mono">{embedType === 'iframe' ? iframeCode : jsCode}</pre>
          <button onClick={() => navigator.clipboard?.writeText(embedType === 'iframe' ? iframeCode : jsCode)} className="absolute top-2 right-2 p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors">
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </Section>
      <Section title="SCORM Export">
        <div className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl">
          <FileText className="w-8 h-8 text-indigo-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800">Export as SCORM Package</p>
            <p className="text-xs text-slate-500 mt-0.5">Compatible with Moodle, Canvas, Blackboard, and other LMS platforms</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">SCORM 1.2</button>
            <button className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">SCORM 2004</button>
          </div>
        </div>
      </Section>
      <Section title="Webhooks">
        <div className="space-y-2">
          {hooks.map((h, i) => (
            <div key={h.event} className="flex items-center gap-2">
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-lg w-36 flex-shrink-0">{h.event}</span>
              <input
                value={h.url}
                onChange={e => { const hs = [...hooks]; hs[i] = { ...h, url: e.target.value }; setHooks(hs) }}
                placeholder="https://your-server.com/webhook"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 font-mono bg-slate-50"
              />
            </div>
          ))}
        </div>
      </Section>
      <Section title="Platform Integrations">
        <div className="grid grid-cols-2 gap-2">
          {integrations.map(int => (
            <div key={int.name} className={`flex items-center gap-2.5 p-3 rounded-xl border transition-colors ${int.connected ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'}`}>
              <span className="text-lg">{int.icon}</span>
              <span className="text-xs font-medium text-slate-700 flex-1 truncate">{int.name}</span>
              <button className={`text-xs font-semibold px-2 py-1 rounded-lg transition-colors ${int.connected ? 'text-red-500 hover:bg-red-50' : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'}`}>
                {int.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

/* ── Save-success Toast ──────────────────────────────────────── */
function SaveToast({ visible }) {
  if (!visible) return null
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg animate-fade-in">
      <Check className="w-4 h-4" />
      Settings saved successfully
    </div>
  )
}

/* ── Main Component ──────────────────────────────────────────── */
export default function QuizSettings() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { quiz, loading } = useQuiz(id)
  const { updateQuiz } = useQuizzes()

  const [activeTab, setActiveTab] = useState(location.state?.tab ?? 'timing')
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [saveError, setSaveError] = useState(null)

  /* ── Settings form state (mapped from DB columns) ── */
  const [settings, setSettings] = useState({
    time_limit_mins:         null,
    max_attempts:            1,
    passing_score_pct:       70,
    shuffle_questions:       false,
    shuffle_options:         false,
    show_results_immediately: true,
    show_correct_answers:    true,
    allow_review:            true,
    certificate_enabled:     false,
    certificate_template:    '{}',
    password_protected:      false,
    access_password:         '',
    require_proctoring:      false,
    is_private:              false,
  })

  /* ── Initialise form state from loaded quiz ── */
  useEffect(() => {
    if (!quiz) return
    setSettings({
      time_limit_mins:          quiz.time_limit_mins          ?? null,
      max_attempts:             quiz.max_attempts             ?? 1,
      passing_score_pct:        quiz.passing_score_pct        ?? 70,
      shuffle_questions:        quiz.shuffle_questions        ?? false,
      shuffle_options:          quiz.shuffle_options          ?? false,
      show_results_immediately: quiz.show_results_immediately ?? true,
      show_correct_answers:     quiz.show_correct_answers     ?? true,
      allow_review:             quiz.allow_review             ?? true,
      certificate_enabled:      quiz.certificate_enabled      ?? false,
      certificate_template:     quiz.certificate_template     ?? '{}',
      password_protected:       quiz.password_protected       ?? false,
      access_password:          quiz.access_password          ?? '',
      require_proctoring:       quiz.require_proctoring       ?? false,
      is_private:               quiz.is_private               ?? false,
    })
  }, [quiz])

  function setSetting(key, value) {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  /* ── Save handler ── */
  async function save() {
    setSaving(true)
    setSaveError(null)
    try {
      const settingsPayload = {
        time_limit_mins:          settings.time_limit_mins,
        max_attempts:             settings.max_attempts,
        passing_score_pct:        settings.passing_score_pct,
        shuffle_questions:        settings.shuffle_questions,
        shuffle_options:          settings.shuffle_options,
        show_results_immediately: settings.show_results_immediately,
        show_correct_answers:     settings.show_correct_answers,
        allow_review:             settings.allow_review,
        certificate_enabled:      settings.certificate_enabled,
        certificate_template:     settings.certificate_template,
        password_protected:       settings.password_protected,
        access_password:          settings.access_password,
        require_proctoring:       settings.require_proctoring,
        is_private:               settings.is_private,
      }
      const { error } = await updateQuiz(id, settingsPayload)
      if (error) {
        setSaveError(error)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } catch (err) {
      setSaveError(err?.message ?? 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  /* ── Loading spinner ── */
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading settings…</p>
        </div>
      </div>
    )
  }

  const quizTitle = quiz?.title ?? 'Quiz Settings'

  const PANELS = { timing: TimingSettings, attempts: AttemptSettings, presentation: PresentationSettings, scoring: ScoringRules, security: SecuritySettings, feedback: FeedbackSettings, certificate: CertificateSettings, integration: IntegrationSettings }
  const Panel = PANELS[activeTab]
  const panelProps = activeTab === 'certificate' ? { settings, onSettingChange: setSetting, quizTitle } : { settings, onSettingChange: setSetting }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-52 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col">
        <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
          <Link to={`/quizzes/${id}/editor`} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors mb-2">
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Editor
          </Link>
          <h2 className="text-sm font-bold text-slate-900 truncate">{quizTitle}</h2>
          <p className="text-xs text-slate-400">Settings</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5 ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <tab.icon className={`w-4 h-4 flex-shrink-0 ${activeTab === tab.id ? 'text-indigo-500' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100 flex-shrink-0 space-y-2">
          {saveError && (
            <p className="text-xs text-red-500 text-center">{saveError}</p>
          )}
          <button onClick={save} disabled={saving} className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
            {saved ? <><Check className="w-4 h-4" /> Saved!</> : saving ? 'Saving…' : <><Save className="w-4 h-4" /> Save Settings</>}
          </button>
        </div>
      </aside>
      {/* Main panel */}
      <main className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl mx-auto">
          <h1 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
            {(() => { const t = TABS.find(t => t.id === activeTab); return t ? <><t.icon className="w-5 h-5 text-indigo-500" />{t.label}</> : null })()}
          </h1>
          <Panel {...panelProps} />
        </div>
      </main>

      <SaveToast visible={saved} />
    </div>
  )
}
