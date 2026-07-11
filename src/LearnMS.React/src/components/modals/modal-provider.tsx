import ErrorModal from "@/components/modals/error-modal";
import RedeemCreditModal from "@/components/modals/redeem-credit-modal";
import ForgotPasswordModal from "@/pages/auth/forgot-password-modal";
import AddAssistantModal from "@/pages/dashboard/assistants/add-assistant-modal";
import SelectAssetsModal from "@/pages/dashboard/files/select-assets-modal";
import AddMultipleQuestionModal from "@/pages/dashboard/questions/add-multiple-question-modal";
import AddValueQuestionModal from "@/pages/dashboard/questions/add-value-question-modal";
import SelectQuestionsModal from "@/pages/dashboard/questions/select-questions-modal";
import AddCreditModal from "@/pages/dashboard/students/add-credit-modal";
import AddStudentModal from "@/pages/dashboard/students/add-student-modal";
import LectureAssetsModal from "@/pages/student/lectures/lecture-assets-modal";
import ProfileModal from "@/pages/student/profile/profile-modal";
import { useModalStore } from "@/store/use-modal-store";
import React from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const modals: Record<string, React.FC<any>> = {
  "add-assistant-modal": AddAssistantModal,
  "add-student-modal": AddStudentModal,
  "add-credit-modal": AddCreditModal,
  "profile-modal": ProfileModal,
  "forgot-password-modal": ForgotPasswordModal,
  "add-multiple-question-modal": AddMultipleQuestionModal,
  "add-value-question-modal": AddValueQuestionModal,
  "select-questions-modal": SelectQuestionsModal,
  "select-assets-modal": SelectAssetsModal,
  "lecture-assets-modal": LectureAssetsModal,
  "error-modal": ErrorModal,
  "redeem-credit-modal": RedeemCreditModal,
};

const ModalProvider = () => {
  const { data, type, onClose } = useModalStore();

  const Modal = modals[type];

  if (!Modal) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return <Modal {...data} onClose={onClose} />;
};

export default ModalProvider;
