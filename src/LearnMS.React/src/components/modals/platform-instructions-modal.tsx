import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { Label } from "../ui/label";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalProvider,
  useModal,
} from "@/components/ui/animated-modal";
import GradientBackground from "@/components/ui/gradient-background";

interface PlatformInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

const PlatformInstructionsContent: React.FC<{
  onClose: () => void;
  onAccept: () => void;
}> = ({ onClose, onAccept }) => {
  const [isAccepted, setIsAccepted] = useState(false);
  const { t } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { setOpen } = useModal();

  const handleAccept = () => {
    if (isAccepted) {
      onAccept();
      onClose();
      setOpen(false);
    }
  };

  const handleClose = () => {
    onClose();
    setOpen(false);
  };

  return (
    <ModalContent className="relative overflow-hidden bg-gradient-to-br from-neutral-600 via-neutral-700 to-neutral-800">
      <div className="absolute inset-0 z-0">
        <GradientBackground />
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-600/50 via-neutral-700/50 to-neutral-800/50"></div>
      </div>

      <div
        className={`relative z-10 flex flex-col h-full ${
          isRTL ? "rtl" : "ltr"
        }`}
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="flex-shrink-0 px-2 mb-4">
          <h2 className="text-2xl font-extrabold text-center text-white">
            {t("platformInstructions.title")}
          </h2>
          <p className="mt-2 text-base text-center text-white/80">
            {t("platformInstructions.subtitle")}
          </p>
        </div>

        <div className="flex-1 min-h-0 px-2 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <div className="pb-4 space-y-5 text-base leading-relaxed text-white/90">
              {t("platformInstructions.instructions", {
                returnObjects: true,
              }).map((instruction: string, index: number) => (
                <div
                  key={index}
                  className={`flex items-start gap-4 ${
                    isRTL ? "flex-row-reverse" : ""
                  }`}
                >
                  <span className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-sm font-bold text-white border rounded-full bg-emerald-500/80 backdrop-blur-sm border-white/20">
                    {index + 1}
                  </span>
                  <p className={`${isRTL ? "text-right" : "text-left"} flex-1`}>
                    {instruction}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-shrink-0 px-2 pt-4 mt-2 space-y-4 border-t border-white/20">
          <div className="flex items-center gap-3">
            <Checkbox
              id="accept-terms"
              checked={isAccepted}
              onCheckedChange={(checked) => setIsAccepted(checked as boolean)}
              className="w-5 h-5 border-white/40 bg-white/10 backdrop-blur-sm data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white data-[state=checked]:border-emerald-500"
            />
            <Label
              className="text-base text-white cursor-pointer"
              htmlFor="accept-terms"
            >
              {t("platformInstructions.acceptTerms")}
            </Label>
          </div>

          <div
            className={`flex gap-3 ${isRTL ? "justify-start" : "justify-end"}`}
          >
            <Button
              className="px-6 py-2 transition-colors border rounded-md text-white/80 border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20"
              variant="outline"
              onClick={handleClose}
            >
              {t("platformInstructions.cancel")}
            </Button>
            <Button
              onClick={handleAccept}
              disabled={!isAccepted}
              className="px-6 py-2 font-semibold text-white transition-colors border rounded-md bg-emerald-600/80 backdrop-blur-sm hover:bg-emerald-700/80 disabled:opacity-50 disabled:cursor-not-allowed border-emerald-500/50"
            >
              {t("platformInstructions.accept")}
            </Button>
          </div>
        </div>
      </div>
    </ModalContent>
  );
};

const PlatformInstructionsModalWrapper: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}> = ({ isOpen, onClose, onAccept }) => {
  const { setOpen } = useModal();

  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen, setOpen]);

  return (
    <ModalBody className="w-[95%] max-w-4xl h-[90vh] max-h-[90vh] p-0">
      <PlatformInstructionsContent onClose={onClose} onAccept={onAccept} />
    </ModalBody>
  );
};

const PlatformInstructionsModal: React.FC<PlatformInstructionsModalProps> = ({
  isOpen,
  onClose,
  onAccept,
}) => {
  return (
    <ModalProvider>
      <Modal>
        <PlatformInstructionsModalWrapper
          isOpen={isOpen}
          onClose={onClose}
          onAccept={onAccept}
        />
      </Modal>
    </ModalProvider>
  );
};

export default PlatformInstructionsModal;
