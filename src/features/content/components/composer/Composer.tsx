import ComposerEditor, { type ComposerProps } from './ComposerEditor'
import ScheduledPostsModal from './schedule/ScheduledPostsModal'

export default function Composer(props: ComposerProps) {
  return <>
    <ComposerEditor {...props} />
    {props.variant !== 'comment' && props.composer.scheduling.listOpen && <ScheduledPostsModal
      open
      onBack={props.composer.scheduling.backToSchedule}
      onClose={props.composer.scheduling.closeList}
    />}
  </>
}
