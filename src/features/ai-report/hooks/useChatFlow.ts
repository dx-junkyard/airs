import { useCallback } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import {
  addMessageAtom,
  addMessagesWithDelayAtom,
  currentInputModeAtom,
  isActionProcessingAtom,
  resetChatAtom,
  removeLastMessageAtom,
  imageAnalysisDescriptionAtom,
  nearbyLandmarksAtom,
} from '@/features/ai-report/atoms/chatAtoms';
import {
  selectedAnimalTypeAtom,
  uploadedPhotoUrlsAtom,
  photoUploadCountAtom,
  collectedImageDescriptionsAtom,
  selectedImageDescriptionAtom,
  selectedLocationAtom,
  currentStepAtom,
  resetSimulationAtom,
  simulationDataAtom,
  reportIdAtom,
  reportTokenAtom,
  reportDateTimeAtom,
  situationDescriptionAtom,
  reportDraftAtom,
  situationTextAtom,
  phoneNumberAtom,
} from '@/features/ai-report/atoms/lineVerifyAtoms';
import {
  actionCategoryAtom,
  currentQuestionAtom,
  questionAnswersAtom,
  questionCountAtom,
  generatedActionDetailAtom,
  resetActionDetailFlowAtom,
  allGeneratedQuestionsAtom,
  nextQuestionIndexAtom,
  MAX_QUESTIONS,
} from '@/features/ai-report/atoms/actionDetailAtoms';
import {
  createBotTextMessage,
  createBotOptionsMessage,
  createBotImageAnalysisDescriptionMessage,
  createBotReportDraftMessage,
  createBotActionCategoryOptionsMessage,
  createBotActionQuestionMessage,
  createBotActionDetailMessage,
  createBotNearbyLandmarksMessage,
  createUserSelectionMessage,
  createUserImageMessage,
  createUserLocationMessage,
  createUserTextMessage,
  createUserDateTimeMessage,
  createUserActionCategoryMessage,
  createUserActionAnswerMessage,
  createUserNearbyLandmarkMessage,
  createSystemMessage,
} from '@/features/ai-report/utils/messageFactory';
import {
  ANIMAL_TYPE_ICONS,
  CHAT_BOT_MESSAGES,
} from '@/features/ai-report/utils/chatFlowConfig';
import { formatReportAsMarkdown } from '@/features/ai-report/utils/reportFormatter';
import type { AnimalTypeConfig } from '@/server/domain/constants/animalTypes';
import { ANIMAL_TYPE_LABELS } from '@/features/ai-report/types';
import type {
  AnimalTypeValue,
  LocationData,
  NearbyLandmark,
} from '@/features/ai-report/types';
import type {
  ActionCategory,
  QuestionChoice,
  QuestionAnswer,
} from '@/features/ai-report/types/actionDetail';
import { ACTION_CATEGORIES } from '@/features/ai-report/types/actionDetail';
import {
  uploadImage,
  analyzeImageWithAI,
  generateReportDraft,
  regenerateReportDraft,
  searchNearbyLandmarks,
} from '@/features/ai-report/actions';
import {
  generateQuestion,
  generateAllQuestions,
  generateActionDetail,
  regenerateActionDetail,
} from '@/features/ai-report/actions/actionDetailActions';
import useLineVerifyReport from '@/hooks/mutations/useLineVerifyReport';
import { generateReportTokenAction } from '@/features/report/tokenActions';

export function useChatFlow(enabledAnimalTypes: AnimalTypeConfig[]) {
  const addMessage = useSetAtom(addMessageAtom);
  const addMessagesWithDelay = useSetAtom(addMessagesWithDelayAtom);
  const setInputMode = useSetAtom(currentInputModeAtom);
  const setIsProcessing = useSetAtom(isActionProcessingAtom);
  const resetChat = useSetAtom(resetChatAtom);
  const resetSimulation = useSetAtom(resetSimulationAtom);
  const removeLastMessage = useSetAtom(removeLastMessageAtom);

  // Form atoms
  const setAnimalType = useSetAtom(selectedAnimalTypeAtom);
  const setPhotoUrls = useSetAtom(uploadedPhotoUrlsAtom);
  const setPhotoUploadCount = useSetAtom(photoUploadCountAtom);
  const setCollectedImageDescriptions = useSetAtom(
    collectedImageDescriptionsAtom
  );
  const setImageDescription = useSetAtom(selectedImageDescriptionAtom);
  const setLocation = useSetAtom(selectedLocationAtom);
  const setCurrentStep = useSetAtom(currentStepAtom);
  const setImageAnalysisDescription = useSetAtom(imageAnalysisDescriptionAtom);
  const imageAnalysisDescription = useAtomValue(imageAnalysisDescriptionAtom);
  const setNearbyLandmarks = useSetAtom(nearbyLandmarksAtom);
  const setReportDateTime = useSetAtom(reportDateTimeAtom);
  const setSituationDescription = useSetAtom(situationDescriptionAtom);
  const setReportDraft = useSetAtom(reportDraftAtom);
  const setPhoneNumber = useSetAtom(phoneNumberAtom);

  // Action detail atoms
  const setActionCategory = useSetAtom(actionCategoryAtom);
  const setCurrentQuestion = useSetAtom(currentQuestionAtom);
  const setQuestionAnswers = useSetAtom(questionAnswersAtom);
  const setQuestionCount = useSetAtom(questionCountAtom);
  const setGeneratedActionDetail = useSetAtom(generatedActionDetailAtom);
  const resetActionDetailFlow = useSetAtom(resetActionDetailFlowAtom);
  const setAllGeneratedQuestions = useSetAtom(allGeneratedQuestionsAtom);
  const setNextQuestionIndex = useSetAtom(nextQuestionIndexAtom);

  const selectedAnimalType = useAtomValue(selectedAnimalTypeAtom);
  const uploadedPhotoUrls = useAtomValue(uploadedPhotoUrlsAtom);
  const photoUploadCount = useAtomValue(photoUploadCountAtom);
  const collectedImageDescriptions = useAtomValue(
    collectedImageDescriptionsAtom
  );
  const selectedImageDescription = useAtomValue(selectedImageDescriptionAtom);
  const selectedLocation = useAtomValue(selectedLocationAtom);
  const simulationData = useAtomValue(simulationDataAtom);
  const reportId = useAtomValue(reportIdAtom);
  const setReportId = useSetAtom(reportIdAtom);
  const reportToken = useAtomValue(reportTokenAtom);
  const setReportToken = useSetAtom(reportTokenAtom);
  const reportDateTime = useAtomValue(reportDateTimeAtom);
  const situationText = useAtomValue(situationTextAtom);
  const reportDraft = useAtomValue(reportDraftAtom);
  const nearbyLandmarks = useAtomValue(nearbyLandmarksAtom);

  // Action detail values
  const actionCategory = useAtomValue(actionCategoryAtom);
  const currentQuestion = useAtomValue(currentQuestionAtom);
  const questionAnswers = useAtomValue(questionAnswersAtom);
  const questionCount = useAtomValue(questionCountAtom);
  const generatedActionDetail = useAtomValue(generatedActionDetailAtom);
  const allGeneratedQuestions = useAtomValue(allGeneratedQuestionsAtom);
  const nextQuestionIndex = useAtomValue(nextQuestionIndexAtom);

  // Report submission mutation
  const { mutate: submitReport } = useLineVerifyReport({
    onSuccess: async (data) => {
      removeLastMessage(); // Remove loading message
      addMessage(createSystemMessage('success', '通報を送信しました'));
      addMessage(createBotTextMessage(CHAT_BOT_MESSAGES.completion));
      setInputMode('completion-actions');
      setReportId(data.id);
      setCurrentStep('complete');
      // Generate JWT token for report edit access
      const token = await generateReportTokenAction(data.id);
      setReportToken(token);
      setIsProcessing(false);
    },
    onError: (error) => {
      removeLastMessage(); // Remove loading message
      addMessage(
        createSystemMessage('error', error.message || '送信に失敗しました')
      );
      setIsProcessing(false);
    },
  });

  /**
   * Initialize chat with welcome messages
   */
  const initializeChat = useCallback(async () => {
    resetChat();
    resetSimulation(); // This also resets reportId
    resetActionDetailFlow(); // Reset action detail state

    // 有効な獣種からオプションを動的生成
    const animalOptions = enabledAnimalTypes.map((config) => ({
      id: config.id,
      label: config.label,
      icon: config.emoji,
      value: config.id,
    }));

    await addMessagesWithDelay(
      [
        createBotTextMessage(CHAT_BOT_MESSAGES.welcome),
        createBotOptionsMessage(
          CHAT_BOT_MESSAGES.animalTypeQuestion,
          animalOptions
        ),
      ],
      300
    );

    setInputMode('animal-selection');
    setCurrentStep('animal-type');
  }, [
    addMessagesWithDelay,
    resetChat,
    resetSimulation,
    resetActionDetailFlow,
    setInputMode,
    setCurrentStep,
    enabledAnimalTypes,
  ]);

  /**
   * Handle animal type selection
   */
  const handleAnimalSelect = useCallback(
    async (type: AnimalTypeValue) => {
      // Add user message
      addMessage(
        createUserSelectionMessage({
          label: ANIMAL_TYPE_LABELS[type],
          value: type,
          icon: ANIMAL_TYPE_ICONS[type],
        })
      );

      // Save to form atom
      setAnimalType(type);
      setCurrentStep('photo');

      // Disable input while bot responds
      setInputMode('disabled');

      // Bot responds with photo prompt
      await addMessagesWithDelay([
        createBotTextMessage(CHAT_BOT_MESSAGES.photoPrompt),
      ]);

      setInputMode('photo-upload');
    },
    [
      addMessage,
      addMessagesWithDelay,
      setAnimalType,
      setCurrentStep,
      setInputMode,
    ]
  );

  /**
   * Handle photo upload
   */
  const handlePhotoUpload = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setInputMode('disabled');

      const newCount = photoUploadCount + 1;
      setPhotoUploadCount(newCount);

      // Show loading message
      addMessage(createSystemMessage('loading', '画像をアップロード中...'));

      try {
        const formData = new FormData();
        formData.append('image', file);
        const result = await uploadImage(formData);

        if (!result.success) {
          throw new Error(result.error || 'アップロードに失敗しました');
        }

        // Remove loading message
        removeLastMessage();

        // Create preview URL for display
        const previewUrl = URL.createObjectURL(file);

        // Add user image message
        addMessage(createUserImageMessage(previewUrl, file.name));

        // Append URL to photo list
        setPhotoUrls([...uploadedPhotoUrls, result.url!]);

        // Show AI analysis loading
        addMessage(createSystemMessage('loading', '画像を解析中...'));

        const analysisResult = await analyzeImageWithAI(result.url!);

        // Remove loading message
        removeLastMessage();

        if (!analysisResult.success) {
          // If analysis fails, add empty description to keep arrays in sync
          setCollectedImageDescriptions([...collectedImageDescriptions, '']);
          // Proceed to datetime step
          await addMessagesWithDelay([
            createBotTextMessage(
              '画像の解析に失敗しましたが、通報は続行できます。'
            ),
          ]);
          setCurrentStep('datetime');
          await addMessagesWithDelay([
            createBotTextMessage(CHAT_BOT_MESSAGES.datetimePrompt),
          ]);
          setInputMode('datetime-input');
          return;
        }

        // フラグごとに判定（3回目以降はスクリーニングスキップ）
        const skipScreening = newCount >= 3;

        if (!skipScreening && !analysisResult.isImageClear) {
          if (analysisResult.description) {
            await addMessagesWithDelay([
              createBotImageAnalysisDescriptionMessage(
                'この写真は不鮮明で被写体を確認できませんでした。もう少し明るい場所や近くから撮った写真を送っていただけますか？',
                analysisResult.description
              ),
            ]);
          } else {
            await addMessagesWithDelay([
              createBotTextMessage(
                'この写真は不鮮明で被写体を確認できませんでした。もう少し明るい場所や近くから撮った写真を送っていただけますか？'
              ),
            ]);
          }
          setInputMode('photo-upload');
          return;
        }

        if (!skipScreening && !analysisResult.containsAnimalOrTrace) {
          await addMessagesWithDelay([
            createBotImageAnalysisDescriptionMessage(
              'この写真では動物や痕跡を確認できませんでした。動物や被害の様子が写った写真を送っていただけますか？',
              analysisResult.description!
            ),
          ]);
          setInputMode('photo-upload');
          return;
        }

        // 獣種一致チェック
        if (
          !skipScreening &&
          selectedAnimalType &&
          selectedAnimalType !== 'other' &&
          analysisResult.detectedAnimalType &&
          analysisResult.detectedAnimalType !== 'other' &&
          analysisResult.detectedAnimalType !== selectedAnimalType
        ) {
          const selectedLabel = ANIMAL_TYPE_LABELS[selectedAnimalType];
          const detectedLabel =
            ANIMAL_TYPE_LABELS[
              analysisResult.detectedAnimalType as AnimalTypeValue
            ] || analysisResult.detectedAnimalType;
          await addMessagesWithDelay([
            createBotImageAnalysisDescriptionMessage(
              `この写真には「${detectedLabel}」が写っているようですが、「${selectedLabel}」として通報されています。別の写真を送っていただけますか？`,
              analysisResult.description!
            ),
          ]);
          setInputMode('photo-upload');
          return;
        }

        // Save description to atom for confirmation
        setImageAnalysisDescription(analysisResult.description!);

        // Show image analysis description for confirmation
        await addMessagesWithDelay([
          createBotImageAnalysisDescriptionMessage(
            '画像を解析しました。この説明で合っていますか？',
            analysisResult.description!
          ),
        ]);

        setInputMode('image-description-confirm');
      } catch (error) {
        removeLastMessage(); // Remove loading message
        addMessage(
          createSystemMessage(
            'error',
            error instanceof Error
              ? error.message
              : 'アップロードに失敗しました'
          )
        );
        // アップロードエラーはカウントを戻す
        setPhotoUploadCount(newCount - 1);
        setInputMode('photo-upload'); // Allow retry
      } finally {
        setIsProcessing(false);
      }
    },
    [
      addMessage,
      addMessagesWithDelay,
      removeLastMessage,
      uploadedPhotoUrls,
      photoUploadCount,
      collectedImageDescriptions,
      setPhotoUrls,
      setPhotoUploadCount,
      setCollectedImageDescriptions,
      setCurrentStep,
      setInputMode,
      setIsProcessing,
      setImageAnalysisDescription,
      selectedAnimalType,
    ]
  );

  /**
   * Handle image description confirm (user says "yes")
   * AI解説を承認して日時入力に遷移
   */
  const handleImageDescriptionConfirm = useCallback(async () => {
    const description = imageAnalysisDescription;
    if (!description) return;

    // Add user message
    addMessage(
      createUserSelectionMessage({
        label: 'はい',
        value: 'confirm',
      })
    );

    // Save to form atom (this becomes the initial situation for AI context)
    setImageDescription(description);
    setSituationDescription(description);

    // Store description for report generation material
    setCollectedImageDescriptions([...collectedImageDescriptions, description]);

    // Clear description
    setImageAnalysisDescription(null);

    // Disable input while bot responds
    setInputMode('disabled');

    // Proceed to datetime input first
    setCurrentStep('datetime');
    await addMessagesWithDelay([
      createBotTextMessage(CHAT_BOT_MESSAGES.datetimePrompt),
    ]);

    setInputMode('datetime-input');
  }, [
    addMessage,
    addMessagesWithDelay,
    imageAnalysisDescription,
    collectedImageDescriptions,
    setImageDescription,
    setSituationDescription,
    setCollectedImageDescriptions,
    setImageAnalysisDescription,
    setCurrentStep,
    setInputMode,
  ]);

  /**
   * Handle image description correction (user says "no" or submits correction)
   * 「いいえ」→修正入力画面表示、修正テキスト送信→修正した解説を保存して遷移
   */
  const handleImageDescriptionCorrect = useCallback(
    async (correctionText: string) => {
      // Empty string means user clicked "No" → show correction input
      if (correctionText === '') {
        addMessage(
          createUserSelectionMessage({
            label: 'いいえ',
            value: 'reject',
          })
        );

        await addMessagesWithDelay([
          createBotTextMessage('どのように違うか教えてください。'),
        ]);

        setInputMode('image-description-correction');
        return;
      }

      // User submitted correction text
      addMessage(createUserTextMessage(correctionText));

      // Combine AI description with user correction
      const aiDescription = imageAnalysisDescription || '';
      const correctedDescription = `${aiDescription}（補足: ${correctionText}）`;

      // Save to form atom
      setImageDescription(correctedDescription);
      setSituationDescription(correctedDescription);

      // Store description for report generation material
      setCollectedImageDescriptions([
        ...collectedImageDescriptions,
        correctedDescription,
      ]);

      // Clear description
      setImageAnalysisDescription(null);

      // Disable input while bot responds
      setInputMode('disabled');

      // Proceed to datetime input
      setCurrentStep('datetime');
      await addMessagesWithDelay([
        createBotTextMessage('ありがとうございます。'),
        createBotTextMessage(CHAT_BOT_MESSAGES.datetimePrompt),
      ]);

      setInputMode('datetime-input');
    },
    [
      addMessage,
      addMessagesWithDelay,
      imageAnalysisDescription,
      collectedImageDescriptions,
      setImageDescription,
      setSituationDescription,
      setCollectedImageDescriptions,
      setImageAnalysisDescription,
      setCurrentStep,
      setInputMode,
    ]
  );

  /**
   * Handle photo skip (proceed without photo)
   * 写真なしの場合、日時入力に遷移
   */
  const handlePhotoSkip = useCallback(async () => {
    setInputMode('disabled');

    // Add user message indicating skip
    addMessage(
      createUserSelectionMessage({
        label: '写真なしで続ける',
        value: 'skip',
      })
    );

    // Proceed to datetime input first
    setCurrentStep('datetime');
    await addMessagesWithDelay([
      createBotTextMessage(CHAT_BOT_MESSAGES.datetimePrompt),
    ]);

    setInputMode('datetime-input');
  }, [addMessage, addMessagesWithDelay, setCurrentStep, setInputMode]);

  /**
   * Handle situation submit (free text input when no photo)
   * 状況入力後、行動カテゴリ選択に進む
   */
  const handleSituationSubmit = useCallback(
    async (text: string) => {
      // Add user message
      addMessage(createUserTextMessage(text));

      // Save to form atom
      setSituationDescription(text);
      setInputMode('disabled');

      // Reset action detail flow for new input
      resetActionDetailFlow();

      // Proceed to action category selection
      setCurrentStep('action-category');
      await addMessagesWithDelay([
        createBotTextMessage('動物の行動について詳しく教えてください。'),
        createBotActionCategoryOptionsMessage(
          'どのような行動でしたか？',
          ACTION_CATEGORIES.map((c) => ({
            id: c.id,
            label: c.label,
            description: c.description,
            icon: c.icon,
          }))
        ),
      ]);

      setInputMode('action-category-selection');
    },
    [
      addMessage,
      addMessagesWithDelay,
      setSituationDescription,
      setCurrentStep,
      setInputMode,
      resetActionDetailFlow,
    ]
  );

  // ========== 行動詳細深掘りAIハンドラ ==========

  /**
   * Handle action category selection
   */
  const handleActionCategorySelect = useCallback(
    async (category: ActionCategory, label: string, icon: string) => {
      // Add user message
      addMessage(createUserActionCategoryMessage(category, label, icon));

      // Save to atom
      setActionCategory(category);
      setQuestionCount(1);
      setInputMode('disabled');

      // Show loading message
      addMessage(createSystemMessage('loading', '質問を生成中...'));

      // Build location context for AI
      const locationContext = selectedLocation
        ? {
            address: selectedLocation.address,
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          }
        : undefined;

      // Generate all questions at once
      const result = await generateAllQuestions({
        category,
        initialSituation: situationText,
        dateTime: reportDateTime,
        location: locationContext,
      });

      // Remove loading message
      removeLastMessage();

      if (!result.success || result.questions.length === 0) {
        // No question needed or error - proceed to generate detail directly
        await addMessagesWithDelay([
          createBotTextMessage(
            result.skipReason || '詳細な質問は不要です。行動詳細を生成します。'
          ),
        ]);

        // Generate action detail
        addMessage(createSystemMessage('loading', '行動詳細を生成中...'));
        const detailResult = await generateActionDetail({
          category,
          initialSituation: situationText,
          questionAnswers: [],
          dateTime: reportDateTime,
          location: locationContext,
        });
        removeLastMessage();

        if (detailResult.success && detailResult.detail) {
          setGeneratedActionDetail(detailResult.detail);
          await addMessagesWithDelay([
            createBotActionDetailMessage(
              '以下の行動詳細を生成しました。',
              detailResult.detail,
              category
            ),
          ]);
          setInputMode('action-detail-confirm');
        } else {
          // Error generating detail, proceed to confirm anyway
          await addMessagesWithDelay([
            createBotTextMessage(
              '行動詳細の生成に失敗しましたが、通報は続行できます。'
            ),
          ]);
          setInputMode('action-detail-confirm');
        }
        return;
      }

      // Save all generated questions and show the first one
      setAllGeneratedQuestions(result.questions);
      setNextQuestionIndex(1);
      setCurrentQuestion(result.questions[0]);
      await addMessagesWithDelay([
        createBotActionQuestionMessage(result.questions[0]),
      ]);
      setInputMode('action-question');
    },
    [
      addMessage,
      addMessagesWithDelay,
      removeLastMessage,
      situationText,
      reportDateTime,
      selectedLocation,
      setActionCategory,
      setQuestionCount,
      setCurrentQuestion,
      setGeneratedActionDetail,
      setAllGeneratedQuestions,
      setNextQuestionIndex,
      setInputMode,
    ]
  );

  /**
   * Handle action question answer
   */
  const handleActionQuestionAnswer = useCallback(
    async (
      questionId: string,
      selectedChoices: QuestionChoice[],
      otherText?: string
    ) => {
      // Add user message
      addMessage(
        createUserActionAnswerMessage(questionId, selectedChoices, otherText)
      );

      // Save answer with full context from current question
      const answer: QuestionAnswer = {
        questionId,
        questionText: currentQuestion?.questionText || '',
        selectedChoiceIds: selectedChoices.map((c) => c.id),
        selectedChoiceLabels: selectedChoices.map((c) => c.label),
        otherText,
        captureKey: currentQuestion?.captureKey || '',
      };

      const newQuestionCount = questionCount + 1;
      const updatedAnswers = [...questionAnswers, answer];

      setQuestionAnswers(updatedAnswers);
      setQuestionCount(newQuestionCount);
      setCurrentQuestion(null);
      setInputMode('disabled');

      // Check if there are more pre-generated questions in the queue
      if (nextQuestionIndex < allGeneratedQuestions.length) {
        const nextQuestion = allGeneratedQuestions[nextQuestionIndex];
        setNextQuestionIndex(nextQuestionIndex + 1);
        setCurrentQuestion(nextQuestion);
        await addMessagesWithDelay([
          createBotActionQuestionMessage(nextQuestion),
        ]);
        setInputMode('action-question');
        return;
      }

      // Build location context for AI
      const locationContext = selectedLocation
        ? {
            address: selectedLocation.address,
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          }
        : undefined;

      // Generate action detail using all collected answers
      addMessage(createSystemMessage('loading', '行動詳細を生成中...'));
      const detailResult = await generateActionDetail({
        category: actionCategory!,
        initialSituation: situationText,
        questionAnswers: updatedAnswers,
        dateTime: reportDateTime,
        location: locationContext,
      });
      removeLastMessage();

      if (detailResult.success && detailResult.detail) {
        setGeneratedActionDetail(detailResult.detail);
        await addMessagesWithDelay([
          createBotActionDetailMessage(
            '以下の行動詳細を生成しました。',
            detailResult.detail,
            actionCategory!
          ),
        ]);
        setInputMode('action-detail-confirm');
      } else {
        // Error generating detail, proceed to confirm anyway
        await addMessagesWithDelay([
          createBotTextMessage(
            '行動詳細の生成に失敗しましたが、通報は続行できます。'
          ),
        ]);
        setInputMode('action-detail-confirm');
      }
    },
    [
      addMessage,
      addMessagesWithDelay,
      removeLastMessage,
      actionCategory,
      currentQuestion,
      situationText,
      reportDateTime,
      selectedLocation,
      questionAnswers,
      questionCount,
      allGeneratedQuestions,
      nextQuestionIndex,
      setQuestionAnswers,
      setQuestionCount,
      setCurrentQuestion,
      setGeneratedActionDetail,
      setNextQuestionIndex,
      setInputMode,
    ]
  );

  /**
   * Handle action detail confirm
   * 行動詳細確認後、レポート案を生成して確認画面へ
   */
  const handleActionDetailConfirm = useCallback(async () => {
    setInputMode('disabled');

    // Show loading message
    addMessage(createSystemMessage('loading', 'レポートを作成中...'));

    // Generate report draft with all collected information
    const draft = await generateReportDraft({
      animalType: selectedAnimalType!,
      situation: situationText,
      dateTime: reportDateTime,
      location: selectedLocation!,
    });

    // Remove loading message
    removeLastMessage();

    // Save report draft
    setReportDraft(draft);

    // Proceed to confirmation
    setCurrentStep('confirm');
    await addMessagesWithDelay([
      createBotTextMessage(CHAT_BOT_MESSAGES.reportGenerated),
      createBotReportDraftMessage(draft),
    ]);

    setInputMode('report-confirm');
  }, [
    addMessage,
    addMessagesWithDelay,
    removeLastMessage,
    selectedAnimalType,
    situationText,
    reportDateTime,
    selectedLocation,
    setReportDraft,
    setCurrentStep,
    setInputMode,
  ]);

  /**
   * Handle request correction for action detail
   */
  const handleActionDetailRequestCorrection = useCallback(async () => {
    setInputMode('disabled');

    await addMessagesWithDelay([
      createBotTextMessage('修正したい点を入力してください。'),
    ]);

    setInputMode('action-detail-correction');
  }, [addMessagesWithDelay, setInputMode]);

  /**
   * Handle action detail correction submit
   */
  const handleActionDetailCorrectionSubmit = useCallback(
    async (correctionText: string) => {
      // Add user message
      addMessage(createUserTextMessage(correctionText));
      setInputMode('disabled');

      // Show loading message
      addMessage(createSystemMessage('loading', '行動詳細を修正中...'));

      // Regenerate action detail
      const result = await regenerateActionDetail(
        generatedActionDetail!,
        correctionText,
        actionCategory!
      );

      // Remove loading message
      removeLastMessage();

      if (result.success && result.detail) {
        setGeneratedActionDetail(result.detail);
        await addMessagesWithDelay([
          createBotActionDetailMessage(
            '行動詳細を修正しました。',
            result.detail,
            actionCategory!
          ),
        ]);
        setInputMode('action-detail-confirm');
      } else {
        // Error, show original
        await addMessagesWithDelay([
          createBotTextMessage('修正に失敗しました。元の内容を使用します。'),
          createBotActionDetailMessage(
            '',
            generatedActionDetail!,
            actionCategory!
          ),
        ]);
        setInputMode('action-detail-confirm');
      }
    },
    [
      addMessage,
      addMessagesWithDelay,
      removeLastMessage,
      actionCategory,
      generatedActionDetail,
      setGeneratedActionDetail,
      setInputMode,
    ]
  );

  /**
   * Handle cancel correction for action detail
   */
  const handleActionDetailCorrectionCancel = useCallback(async () => {
    setInputMode('action-detail-confirm');
  }, [setInputMode]);

  /**
   * Handle back to question (undo last answer)
   */
  const handleActionDetailBackToQuestion = useCallback(async () => {
    if (questionAnswers.length === 0) {
      // Go back to category selection
      resetActionDetailFlow();
      setInputMode('disabled');

      await addMessagesWithDelay([
        createBotActionCategoryOptionsMessage(
          '行動カテゴリを選び直してください。',
          ACTION_CATEGORIES.map((c) => ({
            id: c.id,
            label: c.label,
            description: c.description,
            icon: c.icon,
          }))
        ),
      ]);

      setInputMode('action-category-selection');
      return;
    }

    // Remove last answer and show the question from the pre-generated queue
    const newAnswers = questionAnswers.slice(0, -1);
    setQuestionAnswers(newAnswers);
    setQuestionCount(newAnswers.length + 1);
    setGeneratedActionDetail(null);
    setInputMode('disabled');

    // Get the question that corresponds to the current position from pre-generated list
    const questionIndex = newAnswers.length;
    if (questionIndex < allGeneratedQuestions.length) {
      const question = allGeneratedQuestions[questionIndex];
      setNextQuestionIndex(questionIndex + 1);
      setCurrentQuestion(question);
      await addMessagesWithDelay([
        createBotTextMessage('回答を修正できます。'),
        createBotActionQuestionMessage(question),
      ]);
      setInputMode('action-question');
    } else {
      // Fallback: use generateQuestion if pre-generated questions are not available
      const locationContext = selectedLocation
        ? {
            address: selectedLocation.address,
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          }
        : undefined;

      addMessage(createSystemMessage('loading', '質問を再生成中...'));

      const result = await generateQuestion({
        category: actionCategory!,
        initialSituation: situationText,
        previousAnswers: newAnswers,
        questionNumber: newAnswers.length + 1,
        dateTime: reportDateTime,
        location: locationContext,
      });

      removeLastMessage();

      if (result.success && result.question) {
        setCurrentQuestion(result.question);
        await addMessagesWithDelay([
          createBotTextMessage('回答を修正できます。'),
          createBotActionQuestionMessage(result.question),
        ]);
        setInputMode('action-question');
      } else {
        // Fallback to category selection
        resetActionDetailFlow();
        await addMessagesWithDelay([
          createBotActionCategoryOptionsMessage(
            '行動カテゴリを選び直してください。',
            ACTION_CATEGORIES.map((c) => ({
              id: c.id,
              label: c.label,
              description: c.description,
              icon: c.icon,
            }))
          ),
        ]);
        setInputMode('action-category-selection');
      }
    }
  }, [
    addMessage,
    addMessagesWithDelay,
    removeLastMessage,
    actionCategory,
    situationText,
    reportDateTime,
    selectedLocation,
    questionAnswers,
    allGeneratedQuestions,
    setQuestionAnswers,
    setQuestionCount,
    setCurrentQuestion,
    setGeneratedActionDetail,
    setNextQuestionIndex,
    setInputMode,
    resetActionDetailFlow,
  ]);

  // ========== 日時・位置・確認ハンドラ ==========

  /**
   * Handle datetime submit
   */
  const handleDateTimeSubmit = useCallback(
    async (dateTime: Date) => {
      // Add user message
      addMessage(createUserDateTimeMessage(dateTime));

      // Save to form atom
      setReportDateTime(dateTime);
      setInputMode('disabled');

      // Proceed to location input
      setCurrentStep('location');
      await addMessagesWithDelay([
        createBotTextMessage(CHAT_BOT_MESSAGES.locationPrompt),
      ]);

      setInputMode('location-input');
    },
    [
      addMessage,
      addMessagesWithDelay,
      setReportDateTime,
      setCurrentStep,
      setInputMode,
    ]
  );

  /**
   * Handle location submit
   * 場所入力後、周辺施設を検索して確認ステップに遷移
   */
  const handleLocationSubmit = useCallback(
    async (location: LocationData) => {
      // Add user message
      addMessage(createUserLocationMessage(location));

      // Disable input while bot responds
      setInputMode('disabled');

      // Save to form atom
      setLocation(location);

      // Search for nearby landmarks
      addMessage(createSystemMessage('loading', '周辺施設を検索中...'));

      const result = await searchNearbyLandmarks(
        location.latitude,
        location.longitude,
        100
      );

      // Remove loading message
      removeLastMessage();

      if (result.success && result.landmarks && result.landmarks.length > 0) {
        // Save landmarks to atom
        setNearbyLandmarks(result.landmarks);

        // Show nearby landmarks selection
        await addMessagesWithDelay([
          createBotNearbyLandmarksMessage(
            '周辺100m以内に以下の施設があります。近くのものはどれですか？',
            result.landmarks
          ),
        ]);

        setInputMode('nearby-landmarks-selection');
      } else {
        // No landmarks found, proceed to action category selection
        setNearbyLandmarks([]);

        // Reset action detail flow for new input
        resetActionDetailFlow();

        // Proceed to action category selection
        setCurrentStep('action-category');
        await addMessagesWithDelay([
          createBotTextMessage('動物の行動について詳しく教えてください。'),
          createBotActionCategoryOptionsMessage(
            'どのような行動でしたか？',
            ACTION_CATEGORIES.map((c) => ({
              id: c.id,
              label: c.label,
              description: c.description,
              icon: c.icon,
            }))
          ),
        ]);

        setInputMode('action-category-selection');
      }
    },
    [
      addMessage,
      addMessagesWithDelay,
      removeLastMessage,
      setLocation,
      setNearbyLandmarks,
      setCurrentStep,
      setInputMode,
      resetActionDetailFlow,
    ]
  );

  /**
   * Handle nearby landmark selection
   * 周辺施設選択後、ランドマーク情報を保持して行動カテゴリ選択に遷移
   */
  const handleNearbyLandmarkSelect = useCallback(
    async (landmark: NearbyLandmark) => {
      // Add user message
      addMessage(createUserNearbyLandmarkMessage(landmark));

      // 住所文字列は変更せず、説明文用にランドマーク名のみ保持
      if (selectedLocation) {
        const updatedLocation = {
          ...selectedLocation,
          landmarkName: landmark.name,
        };
        setLocation(updatedLocation);
      }

      // Clear landmarks
      setNearbyLandmarks([]);

      // Disable input while bot responds
      setInputMode('disabled');

      // Reset action detail flow for new input
      resetActionDetailFlow();

      // Proceed to action category selection
      setCurrentStep('action-category');
      await addMessagesWithDelay([
        createBotTextMessage('動物の行動について詳しく教えてください。'),
        createBotActionCategoryOptionsMessage(
          'どのような行動でしたか？',
          ACTION_CATEGORIES.map((c) => ({
            id: c.id,
            label: c.label,
            description: c.description,
            icon: c.icon,
          }))
        ),
      ]);

      setInputMode('action-category-selection');
    },
    [
      addMessage,
      addMessagesWithDelay,
      selectedLocation,
      setLocation,
      setNearbyLandmarks,
      setCurrentStep,
      setInputMode,
      resetActionDetailFlow,
    ]
  );

  /**
   * Handle skip nearby landmark selection
   * 該当なし選択後、行動カテゴリ選択に遷移
   */
  const handleNearbyLandmarkSkip = useCallback(async () => {
    // Add user message
    addMessage(createUserNearbyLandmarkMessage(null));

    // Clear landmarks
    setNearbyLandmarks([]);

    // Disable input while bot responds
    setInputMode('disabled');

    // Reset action detail flow for new input
    resetActionDetailFlow();

    // Proceed to action category selection
    setCurrentStep('action-category');
    await addMessagesWithDelay([
      createBotTextMessage('動物の行動について詳しく教えてください。'),
      createBotActionCategoryOptionsMessage(
        'どのような行動でしたか？',
        ACTION_CATEGORIES.map((c) => ({
          id: c.id,
          label: c.label,
          description: c.description,
          icon: c.icon,
        }))
      ),
    ]);

    setInputMode('action-category-selection');
  }, [
    addMessage,
    addMessagesWithDelay,
    setNearbyLandmarks,
    setCurrentStep,
    setInputMode,
    resetActionDetailFlow,
  ]);

  /**
   * Handle request correction
   */
  const handleRequestCorrection = useCallback(async () => {
    setInputMode('disabled');

    await addMessagesWithDelay([
      createBotTextMessage(CHAT_BOT_MESSAGES.correctionPrompt),
    ]);

    setInputMode('report-correction');
  }, [addMessagesWithDelay, setInputMode]);

  /**
   * Handle correction submit
   */
  const handleCorrectionSubmit = useCallback(
    async (correctionText: string) => {
      // Add user message
      addMessage(createUserTextMessage(correctionText));
      setInputMode('disabled');

      // Show loading message
      addMessage(createSystemMessage('loading', '修正しています...'));

      // Regenerate report draft with AI
      const updatedDraft = await regenerateReportDraft(
        reportDraft!,
        correctionText
      );

      // Remove loading message
      removeLastMessage();

      // Save updated draft
      setReportDraft(updatedDraft);

      // Bot responds with updated report
      await addMessagesWithDelay([
        createBotTextMessage(CHAT_BOT_MESSAGES.reportRegenerated),
        createBotReportDraftMessage(updatedDraft),
      ]);

      setInputMode('report-confirm');
    },
    [
      addMessage,
      addMessagesWithDelay,
      removeLastMessage,
      reportDraft,
      setReportDraft,
      setInputMode,
    ]
  );

  /**
   * Perform the actual report submission with optional phone number
   */
  const performSubmission = useCallback(
    (phoneNumber: string) => {
      setIsProcessing(true);
      setInputMode('disabled');

      // Show loading message
      addMessage(createSystemMessage('loading', '送信中...'));

      // Create FormData from simulation data
      const formData = new FormData();
      if (simulationData.animalType) {
        formData.append('animalType', simulationData.animalType);
      }
      // Send images as JSON array [{url, description}, ...]
      const images = uploadedPhotoUrls.map((url: string, i: number) => ({
        url,
        description: collectedImageDescriptions[i] || '',
      }));
      formData.append('images', JSON.stringify(images));

      if (simulationData.location) {
        formData.append(
          'latitude',
          simulationData.location.latitude.toString()
        );
        formData.append(
          'longitude',
          simulationData.location.longitude.toString()
        );
        formData.append('address', simulationData.location.address);
        if (simulationData.location.normalizedAddress) {
          formData.append(
            'normalizedAddress',
            JSON.stringify(simulationData.location.normalizedAddress)
          );
        }
      }

      // Format description as Markdown from report draft
      const description = reportDraft
        ? formatReportAsMarkdown(reportDraft)
        : simulationData.description || '';
      formData.append('description', description);

      // Add phone number if provided
      if (phoneNumber) {
        formData.append('phoneNumber', phoneNumber);
      }

      // Submit report
      submitReport(formData);
    },
    [
      addMessage,
      simulationData,
      uploadedPhotoUrls,
      collectedImageDescriptions,
      reportDraft,
      submitReport,
      setIsProcessing,
      setInputMode,
    ]
  );

  /**
   * Handle confirmation — transition to phone number input step
   */
  const handleConfirm = useCallback(async () => {
    setInputMode('disabled');

    // Show phone number prompt
    await addMessagesWithDelay([
      createBotTextMessage(CHAT_BOT_MESSAGES.phoneNumberPrompt),
    ]);

    setInputMode('phone-number-input');
  }, [addMessagesWithDelay, setInputMode]);

  /**
   * Handle phone number submit — save and proceed to submission
   */
  const handlePhoneNumberSubmit = useCallback(
    (phoneNumber: string) => {
      // Add user message showing the phone number
      addMessage(createUserTextMessage(phoneNumber));

      // Save to atom
      setPhoneNumber(phoneNumber);

      // Proceed to actual submission
      performSubmission(phoneNumber);
    },
    [addMessage, setPhoneNumber, performSubmission]
  );

  /**
   * Handle phone number skip — proceed to submission without phone number
   */
  const handlePhoneNumberSkip = useCallback(() => {
    addMessage(
      createUserSelectionMessage({
        label: 'スキップ',
        value: 'skip',
      })
    );

    // Proceed to submission without phone number
    performSubmission('');
  }, [addMessage, performSubmission]);

  /**
   * Reset and start over
   */
  const handleStartOver = useCallback(() => {
    initializeChat();
  }, [initializeChat]);

  return {
    initializeChat,
    handleAnimalSelect,
    handlePhotoUpload,
    handleImageDescriptionConfirm,
    handleImageDescriptionCorrect,
    handlePhotoSkip,
    handleSituationSubmit,
    // 行動詳細深掘りAIハンドラ
    handleActionCategorySelect,
    handleActionQuestionAnswer,
    handleActionDetailConfirm,
    handleActionDetailRequestCorrection,
    handleActionDetailCorrectionSubmit,
    handleActionDetailCorrectionCancel,
    handleActionDetailBackToQuestion,
    // 日時・位置・確認
    handleDateTimeSubmit,
    handleLocationSubmit,
    // 周辺施設選択
    handleNearbyLandmarkSelect,
    handleNearbyLandmarkSkip,
    nearbyLandmarks,
    // 確認・送信
    handleRequestCorrection,
    handleCorrectionSubmit,
    handleConfirm,
    // 電話番号入力
    handlePhoneNumberSubmit,
    handlePhoneNumberSkip,
    handleStartOver,
    reportId,
    reportToken,
    selectedLocation,
  };
}

export default useChatFlow;
