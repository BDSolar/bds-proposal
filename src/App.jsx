import { useProposal } from './context/ProposalContext'
import StepNav from './components/StepNav'
import S0b_DataCapture from './sections/S0b_DataCapture'
import S0_AboutUs from './sections/S0_AboutUs'
import S0b_ProposalIntro from './sections/S0b_ProposalIntro'
import S1_TheProblem from './sections/S1_TheProblem'
import S2_EnergyLife from './sections/S2_EnergyLife'
import S3_AddingSolar from './sections/S3_AddingSolar'
import S4_AddingBattery from './sections/S4_AddingBattery'
import S5_BeforeAfter from './sections/S5_BeforeAfter'
import S6_MoneyOverTime from './sections/S6_MoneyOverTime'
import S7_YourSystem from './sections/S7_YourSystem'
import S8_Assumptions from './sections/S8_Assumptions'

const SECTIONS = [
  S0b_DataCapture,   // 0
  S0_AboutUs,        // 1
  S0b_ProposalIntro, // 2
  S1_TheProblem,     // 3
  S2_EnergyLife,     // 4
  S3_AddingSolar,    // 5
  S4_AddingBattery,  // 6
  S5_BeforeAfter,    // 7
  S6_MoneyOverTime,  // 8
  S7_YourSystem,     // 9
  S8_Assumptions,    // 10
]

export default function App() {
  const { state } = useProposal()
  const { currentStep } = state

  const CurrentSection = SECTIONS[currentStep] || SECTIONS[0]
  const showNav = state.formSubmitted || currentStep > 0

  return (
    <>
      <div className="ambient-glow" />
      <div className="ambient-glow-2" />
      <StepNav />
      <div className={`app-content${showNav ? ' nav-visible' : ''}`}>
        <CurrentSection />
      </div>
    </>
  )
}
