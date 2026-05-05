import * as React from 'react';
import type { TransactionalTemplate, PayloadFor } from '@/lib/emails/templates';

import { RegistrationReceived, registrationReceivedSubject } from './registration-received';
import { WaitlistJoined, waitlistJoinedSubject } from './waitlist-joined';
import { RegistrationApproved, registrationApprovedSubject } from './registration-approved';
import { RegistrationRejected, registrationRejectedSubject } from './registration-rejected';
import { LotterySelected, lotterySelectedSubject } from './lottery-selected';
import { LotteryNotSelected, lotteryNotSelectedSubject } from './lottery-not-selected';
import { WaitlistPromoted, waitlistPromotedSubject } from './waitlist-promoted';
import { PlusOneInviteReceived, plusOneInviteReceivedSubject } from './plus-one-invite-received';
import { PlusOneAccepted, plusOneAcceptedSubject } from './plus-one-accepted';
import { PlusOneDeclined, plusOneDeclinedSubject } from './plus-one-declined';
import { PlusOneCancelled, plusOneCancelledSubject } from './plus-one-cancelled';
import { EventChanged, eventChangedSubject } from './event-changed';
import { EventCancelled, eventCancelledSubject } from './event-cancelled';
import { EventReminder, eventReminderSubject } from './event-reminder';
import { PhotosAvailable, photosAvailableSubject } from './photos-available';
import { AdminReply, adminReplySubject } from './admin-reply';

type Renderer<T extends TransactionalTemplate> = {
  subject: (p: PayloadFor<T>) => string;
  component: (p: PayloadFor<T>) => React.ReactElement;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const REGISTRY: Record<TransactionalTemplate, Renderer<any>> = {
  registration_received: { subject: registrationReceivedSubject, component: RegistrationReceived },
  waitlist_joined: { subject: waitlistJoinedSubject, component: WaitlistJoined },
  registration_approved: { subject: registrationApprovedSubject, component: RegistrationApproved },
  registration_rejected: { subject: registrationRejectedSubject, component: RegistrationRejected },
  lottery_selected: { subject: lotterySelectedSubject, component: LotterySelected },
  lottery_not_selected: { subject: lotteryNotSelectedSubject, component: LotteryNotSelected },
  waitlist_promoted: { subject: waitlistPromotedSubject, component: WaitlistPromoted },
  plus_one_invite_received: { subject: plusOneInviteReceivedSubject, component: PlusOneInviteReceived },
  plus_one_accepted: { subject: plusOneAcceptedSubject, component: PlusOneAccepted },
  plus_one_declined: { subject: plusOneDeclinedSubject, component: PlusOneDeclined },
  plus_one_cancelled: { subject: plusOneCancelledSubject, component: PlusOneCancelled },
  event_changed: { subject: eventChangedSubject, component: EventChanged },
  event_cancelled: { subject: eventCancelledSubject, component: EventCancelled },
  event_reminder: { subject: eventReminderSubject, component: EventReminder },
  photos_available: { subject: photosAvailableSubject, component: PhotosAvailable },
  admin_reply: { subject: adminReplySubject, component: AdminReply },
};

export function getSubject<T extends TransactionalTemplate>(template: T, payload: PayloadFor<T>): string {
  return REGISTRY[template].subject(payload);
}

export function getComponent<T extends TransactionalTemplate>(
  template: T,
  payload: PayloadFor<T>,
): React.ReactElement {
  return REGISTRY[template].component(payload);
}
