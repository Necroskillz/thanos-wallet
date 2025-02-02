import * as React from "react";
import { useForm } from "react-hook-form";
import { ActivationStatus, useTezos, useAccount } from "lib/thanos/front";
import useIsMounted from "lib/ui/useIsMounted";
import AccountBanner from "app/templates/AccountBanner";
import Alert from "app/atoms/Alert";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";

type FormData = {
  secret: string;
};

const SUBMIT_ERROR_TYPE = "submit-error";

const ActivateAccount: React.FC = () => {
  const tezos = useTezos();
  const account = useAccount();
  const isMounted = useIsMounted();

  const [success, setSuccessPure] = React.useState<React.ReactNode>(null);
  const setSuccess = React.useCallback<typeof setSuccessPure>(
    (val) => {
      if (isMounted()) {
        setSuccessPure(val);
      }
    },
    [setSuccessPure, isMounted]
  );

  const activateAccount = React.useCallback(
    async (address: string, secret: string) => {
      let op;
      try {
        op = await tezos.tz.activate(address, secret);
      } catch (err) {
        const invalidActivationError =
          err && err.body && /Invalid activation/.test(err.body);
        if (invalidActivationError) {
          return [ActivationStatus.AlreadyActivated] as [ActivationStatus];
        }

        throw err;
      }

      return [ActivationStatus.ActivationRequestSent, op] as [
        ActivationStatus,
        typeof op
      ];
    },
    [tezos]
  );

  const {
    register,
    handleSubmit,
    formState,
    clearError,
    setError,
    errors,
  } = useForm<FormData>();
  const submitting = formState.isSubmitting;

  const onSubmit = React.useCallback(
    async (data: FormData) => {
      if (submitting) return;

      clearError("secret");
      setSuccess(null);

      try {
        const [activationStatus, op] = await activateAccount(
          account.publicKeyHash,
          data.secret.replace(/\s/g, "")
        );
        switch (activationStatus) {
          case ActivationStatus.AlreadyActivated:
            setSuccess("🏁 Your Account already activated.");
            break;

          case ActivationStatus.ActivationRequestSent:
            setSuccess("🛫 Activation request sent! Confirming...");
            op!.confirmation().then(() => {
              setSuccess("✅ Your account successfully activated!");
            });
            break;
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay.
        await new Promise((res) => setTimeout(res, 300));
        const mes =
          "Failed. This may happen because provided Secret is invalid";
        setError("secret", SUBMIT_ERROR_TYPE, mes);
      }
    },
    [
      clearError,
      submitting,
      setError,
      setSuccess,
      activateAccount,
      account.publicKeyHash,
    ]
  );

  const submit = React.useMemo(() => handleSubmit(onSubmit), [
    handleSubmit,
    onSubmit,
  ]);

  const handleSecretFieldKeyPress = React.useCallback(
    (evt) => {
      if (evt.which === 13 && !evt.shiftKey) {
        evt.preventDefault();
        submit();
      }
    },
    [submit]
  );

  return (
    <form className="w-full max-w-sm p-2 mx-auto" onSubmit={submit}>
      <AccountBanner
        account={account}
        labelDescription={
          <>
            Account to be activated.
            <br />
            If you want to activate another account - please, select it in the top-right dropdown.
          </>
        }
        className="mb-6"
      />

      {success && (
        <Alert
          type="success"
          title="Success"
          description={success}
          autoFocus
          className="mb-4"
        />
      )}

      <FormField
        textarea
        rows={2}
        ref={register({ required: "Required" })}
        name="secret"
        id="activateaccount-secret"
        label="Secret"
        labelDescription="'secret' field from Fundraiser Account or Faucet"
        placeholder="e.g. n4hs7sd3..."
        errorCaption={errors.secret?.message}
        style={{ resize: "none" }}
        containerClassName="mb-4"
        onKeyPress={handleSecretFieldKeyPress}
      />

      <FormSubmitButton loading={submitting} disabled={submitting}>
        Activate
      </FormSubmitButton>
    </form>
  );
};

export default ActivateAccount;
