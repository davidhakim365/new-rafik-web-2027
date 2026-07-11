import "i18next";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: {
      translation: {
        hero: {
          title: string;
          subtitle: string;
          description: string;
          getStarted: string;
          browseCourses: string;
        };
        importantLectures: {
          title: string;
          description: string;
          badge: string;
          featured: string;
          goToCourse: string;
        };
        latestLectures: {
          badge: string;
          title: string;
          description: string;
          selectLevel: string;
          selectCourse: string;
          levels: {
            all: string;
            level0: string;
            level1: string;
            level2: string;
            level3: string;
          };
          pagination: {
            showing: string;
            of: string;
            totalResults: string;
          };
        };
        seniors: {
          title: string;
          description: string;
          heading: string;
          headingHighlight: string;
          subheading: string;
          badge: string;
          classes: {
            [key: string]: string;
          };
          descriptions: {
            [key: string]: string;
          };
          years: {
            [key: string]: string;
          };
        };
        memories: {
          badge: string;
          title: string;
          description: string;
          items: {
            [key: string]: {
              title: string;
              description: string;
            };
          };
        };
        about: {
          badge: string;
          title: string;
          description: string;
          items: {
            [key: string]: {
              title: string;
              description: string;
            };
          };
          imageAlt: string;
        };
        navbar: {
          links: {
            home: string;
            courses: string;
            payments: string;
          };
          language: string;
          languages: {
            english: string;
            arabic: string;
          };
          currency: string;
          profile: string;
          logout: string;
          signIn: string;
        };
        footer: {
          brand: string;
          copyright: string;
          social: {
            facebook: string;
            youtube: string;
            whatsapp: string;
          };
          links: {
            home: string;
            courses: string;
            payments: string;
          };
        };
        auth: {
          back: string;
          brand: string;
          welcomeBack: string;
          joinCommunity: string;
          loginDescription: string;
          registerDescription: string;
          loginTagline: string;
          registerTagline: string;
          signInTitle: string;
          createAccountTitle: string;
          signInSubtitle: string;
          createAccountSubtitle: string;
          noAccount: string;
          haveAccount: string;
          createAccount: string;
          signIn: string;
          forms: {
            email: {
              label: string;
              placeholder: string;
            };
            password: {
              label: string;
              placeholder: string;
            };
            confirmPassword: {
              label: string;
              placeholder: string;
            };
            fullName: {
              label: string;
              placeholder: string;
            };
            phoneNumber: {
              label: string;
              placeholder: string;
            };
            parentPhoneNumber: {
              label: string;
              placeholder: string;
            };
            studentCode: {
              label: string;
              placeholder: string;
            };
            school: {
              label: string;
              placeholder: string;
            };
            level: {
              label: string;
              placeholder: string;
              options: {
                level0: string;
                level1: string;
                level2: string;
                level3: string;
              };
            };
            forgotPassword: string;
            signIn: string;
            createAccount: string;
            errors: {
              loginFailed: string;
              registrationFailed: string;
              accountCreated: string;
              welcomeBack: string;
            };
          };
        };
        grades: {
          title: string;
          description: string;
          items: {
            thirdMiddle: {
              title: string;
              description: string;
            };
            firstSecondary: {
              title: string;
              description: string;
            };
            secondSecondary: {
              title: string;
              description: string;
            };
            thirdSecondary: {
              title: string;
              description: string;
            };
          };
        };
        courses: {
          heroTitle: string;
          courseImageAlt: string;
          coursePreview: string;
          renewal: string;
          daysRemaining: string;
          expired: string;
          status: {
            active: string;
            expired: string;
            available: string;
          };
          buttons: {
            enroll: string;
            continue: string;
            renew: string;
            viewCourse: string;
          };
          enrollmentPrice: string;
          renewalPrice: string;
          enrollNow: string;
          expiresOn: string;
          lectures: string;
          lecturesAvailable: string;
          lecturesAvailablePlural: string;
          exams: string;
          examsAvailable: string;
          examsAvailablePlural: string;
          description: string;
          order: string;
          startLecture: string;
          takeExam: string;
          confirmEnrollment: string;
          confirmEnrollmentDescription: string;
          confirmRenewal: string;
          confirmRenewalDescription: string;
          cancel: string;
          confirmEnrollmentButton: string;
          confirmRenewalButton: string;
          processing: string;
          lessons: string;
          quizzes: string;
          questions: string;
          noContentAvailable: string;
          noContentMessage: string;
          attachments: string;
          assets: string;
          noAttachmentsAvailable: string;
          noAssetsAvailable: string;
          enrollmentExpiredMessage: string;
          joinStudentsMessage: string;
          insufficientBalance: string;
          buyCredit: string;
          levelMismatch: string;
          pleaseSignIn: string;
          signInToBuyCourse: string;
          signInToBuyLecture: string;
          activeEnrollmentMessage: string;
        };
        payments: {
          title: string;
          subtitle: string;
          noPayments: string;
          noPaymentsDescription: string;
          course: string;
          amount: string;
          date: string;
          transactionId: string;
          checkStatus: string;
          paymentCard: {
            title: string;
          };
          status: {
            completed: string;
            pending: string;
            failed: string;
          };
        };
        common: {
          currency: string;
          showMore: string;
          showLess: string;
        };
        redeem: {
          title: string;
          description: string;
          placeholder: string;
          submit: string;
          submitting: string;
          success: {
            title: string;
            description: string;
          };
          error: {
            title: string;
          };
        };
        profile: {
          account: string;
          contact: string;
          events: string;
          sessions: string;
          exams: string;
          profileAndDetails: string;
          contactAssistantToEdit: string;
          profileUpdated: string;
          profileUpdatedDescription: string;
          fullName: string;
          fullNameDescription: string;
          school: string;
          schoolDescription: string;
          level: string;
          levelDescription: string;
          selectLevel: string;
          level3rdPrep: string;
          level1stSecondary: string;
          level2ndSecondary: string;
          level3rdSecondary: string;
          phoneNumber: string;
          phoneNumberDescription: string;
          parentPhoneNumber: string;
          parentPhoneNumberDescription: string;
          studentId: string;
          studentIdDescription: string;
          title: string;
          email: string;
          parentPhone: string;
          balance: string;
          joinedDate: string;
          notAvailable: string;
          levelKindergarten: string;
          levelElementary: string;
          levelMiddleSchool: string;
          levelHighSchool: string;
        };
        platformInstructions: {
          title: string;
          subtitle: string;
          instructions: string[];
          acceptTerms: string;
          accept: string;
          cancel: string;
        };
        lectures: {
          lectureContent: string;
          confirmPurchase: string;
          confirmPurchaseDescription: string;
          buyFor: string;
          renewFor: string;
          lectureExpiresOn: string;
          courseExpiresOn: string;
          isLocked: string;
          isLockedDescription: string;
          locked: string;
          lesson: string;
          quiz: string;
          lessons: string;
          quizzes: string;
          startLesson: string;
          noContentAvailable: string;
          purchaseSuccessful: string;
        };
        lesson: {
          startLessonTitle: string;
          startLessonConfirmation: string;
          startLessonConfirmationTitle: string;
          startLessonConfirmationDescription: string;
          start: string;
          lessonExpiredTitle: string;
          lessonExpiredMessage: string;
          renewLessonConfirmationTitle: string;
          renewLessonConfirmationDescription: string;
          renew: string;
          expiresAt: string;
          back: string;
        };
        quiz: {
          questions: string;
          takeQuiz: string;
          startQuiz: string;
        };
        exams: {
          questions: string;
          minutes: string;
          retake: string;
          purchaseSuccessful: string;
          enrollNow: string;
          examPrice: string;
          retakePrice: string;
          examInfo: string;
          importantNote: string;
          buttons: {
            takeExam: string;
          };
        };
        error: {
          title: string;
          message: string;
          description: string;
          errorDetails: string;
          noErrorDetails: string;
          reloadPage: string;
          goToHomepage: string;
        };
      };
    };
  }
}
